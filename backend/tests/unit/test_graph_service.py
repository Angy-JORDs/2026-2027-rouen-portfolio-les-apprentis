"""Tests unitaires — GraphService (Neo4j + MongoDB simulés)."""

from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from portfolio_api.services.graph_service import GraphService

from ..conftest import PROJET

ROWS = [
    {"candidat_slug": "alice-martin", "prenom": "Alice", "nom": "Martin",
     "projet_slug": "p1", "projet_titre": "P1", "skill_slug": "python", "skill_nom": "Python"},
    {"candidat_slug": "alice-martin", "prenom": "Alice", "nom": "Martin",
     "projet_slug": "p1", "projet_titre": "P1", "skill_slug": "mongodb", "skill_nom": "MongoDB"},
    {"candidat_slug": "alice-martin", "prenom": "Alice", "nom": "Martin",
     "projet_slug": "p2", "projet_titre": "P2", "skill_slug": "python", "skill_nom": "Python"},
]


@pytest.fixture
def neo4j_repo():
    return AsyncMock()


@pytest.fixture
def projet_repo():
    return AsyncMock()


@pytest.fixture
def service(neo4j_repo, projet_repo):
    return GraphService(neo4j_repo=neo4j_repo, projet_repo=projet_repo)


class TestSimilarProjets:
    async def test_none_when_projet_unknown(self, service, neo4j_repo):
        neo4j_repo.get_projet.return_value = None
        assert await service.get_similar_projets("zzz") is None
        neo4j_repo.get_similar_projets.assert_not_called()

    async def test_returns_similaires(self, service, neo4j_repo):
        neo4j_repo.get_projet.return_value = {"projet_slug": "a", "titre": "A"}
        neo4j_repo.get_similar_projets.return_value = [
            {"projet_slug": "b", "titre": "B", "competences_communes": 2, "competences": ["python", "neo4j"]}
        ]
        result = await service.get_similar_projets("a", limit=3)
        assert result.projet_slug == "a" and result.similaires[0].competences_communes == 2
        neo4j_repo.get_similar_projets.assert_awaited_once_with("a", limit=3)


class TestCandidatGraph:
    async def test_none_when_candidat_unknown(self, service, neo4j_repo):
        neo4j_repo.get_candidat_graph.return_value = []
        assert await service.get_candidat_graph("nobody") is None

    async def test_builds_unique_nodes_and_links(self, service, neo4j_repo):
        neo4j_repo.get_candidat_graph.return_value = ROWS
        graph = await service.get_candidat_graph("alice-martin")
        ids = [n.id for n in graph.nodes]
        assert len(ids) == len(set(ids))
        assert set(ids) == {
            "candidat:alice-martin", "projet:p1", "projet:p2", "competence:python", "competence:mongodb",
        }
        assert len(graph.links) == 5  # 2 REALISE + 3 UTILISE
        assert any(l.source == "projet:p2" and l.target == "competence:python" for l in graph.links)

    async def test_candidat_without_project_has_single_node(self, service, neo4j_repo):
        neo4j_repo.get_candidat_graph.return_value = [
            {"candidat_slug": "bob", "prenom": "Bob", "nom": "Durand", "projet_slug": None,
             "projet_titre": None, "skill_slug": None, "skill_nom": None}
        ]
        graph = await service.get_candidat_graph("bob")
        assert len(graph.nodes) == 1 and graph.links == []


class TestByCompetence:
    async def test_candidats_none_when_competence_unknown(self, service, neo4j_repo):
        neo4j_repo.get_competence.return_value = None
        assert await service.get_candidats_by_competence("cobol") is None

    async def test_candidats(self, service, neo4j_repo):
        neo4j_repo.get_competence.return_value = {"skill_slug": "python", "nom": "Python"}
        neo4j_repo.get_candidats_by_competence.return_value = [
            {"candidat_slug": "alice-martin", "prenom": "Alice", "nom": "Martin", "nb_projets": 2}
        ]
        result = await service.get_candidats_by_competence("python")
        assert result.nom == "Python" and result.candidats[0].nb_projets == 2

    async def test_projets_are_hydrated_from_mongo_in_graph_order(self, service, neo4j_repo, projet_repo):
        neo4j_repo.get_competence.return_value = {"skill_slug": "python", "nom": "Python"}
        neo4j_repo.get_projet_slugs_by_competence.return_value = ["z-projet", "smartcity-explorer", "fantome"]
        projet_repo.get_projets_by_slugs.return_value = [
            PROJET, {**PROJET, "projet_slug": "z-projet", "titre": "Z"}
        ]  # "fantome" absent de Mongo : ignoré
        result = await service.get_projets_by_competence("python")
        assert [p.projet_slug for p in result.projets] == ["z-projet", "smartcity-explorer"]
