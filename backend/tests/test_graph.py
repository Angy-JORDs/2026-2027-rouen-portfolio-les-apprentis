"""Tests d'acceptation — Endpoints Graphe et Compétences (R4 à R7)."""

from __future__ import annotations

from .conftest import PROJET

ROWS = [
    {"candidat_slug": "alice-martin", "prenom": "Alice", "nom": "Martin",
     "projet_slug": "p1", "projet_titre": "P1", "skill_slug": "python", "skill_nom": "Python"},
    {"candidat_slug": "alice-martin", "prenom": "Alice", "nom": "Martin",
     "projet_slug": "p1", "projet_titre": "P1", "skill_slug": "mongodb", "skill_nom": "MongoDB"},
]


class TestSimilarProjets:  # R4
    def test_schema_and_limit(self, api, repos):
        repos.neo4j.get_projet.return_value = {"projet_slug": "a", "titre": "A"}
        repos.neo4j.get_similar_projets.return_value = [
            {"projet_slug": "b", "titre": "B", "competences_communes": 2, "competences": ["python", "neo4j"]}
        ]
        data = api.get("/api/graph/projets/a/similaires", params={"limit": 3}).json()
        assert data["projet_slug"] == "a" and data["similaires"][0]["competences_communes"] == 2
        repos.neo4j.get_similar_projets.assert_awaited_once_with("a", limit=3)

    def test_unknown_projet(self, api, repos):
        repos.neo4j.get_projet.return_value = None
        resp = api.get("/api/graph/projets/zzz/similaires")
        assert resp.status_code == 404 and resp.json() == {"detail": "Projet non trouvé"}

    def test_limit_out_of_range_is_422(self, api):
        assert api.get("/api/graph/projets/a/similaires", params={"limit": 0}).status_code == 422


class TestCandidatGraph:  # R5
    def test_nodes_and_links(self, api, repos):
        repos.neo4j.get_candidat_graph.return_value = ROWS
        data = api.get("/api/graph/competences/alice-martin").json()
        ids = {n["id"] for n in data["nodes"]}
        assert ids == {"candidat:alice-martin", "projet:p1", "competence:python", "competence:mongodb"}
        assert {"source": "projet:p1", "target": "competence:python", "type": "UTILISE"} in data["links"]

    def test_unknown_candidat(self, api, repos):
        repos.neo4j.get_candidat_graph.return_value = []
        assert api.get("/api/graph/competences/nobody").status_code == 404


class TestCandidatsByCompetence:  # R6
    def test_schema(self, api, repos):
        repos.neo4j.get_competence.return_value = {"skill_slug": "python", "nom": "Python"}
        repos.neo4j.get_candidats_by_competence.return_value = [
            {"candidat_slug": "alice-martin", "prenom": "Alice", "nom": "Martin", "nb_projets": 2}
        ]
        data = api.get("/api/competences/python/candidats").json()
        assert data["nom"] == "Python" and data["candidats"][0]["nb_projets"] == 2

    def test_unknown_competence(self, api, repos):
        repos.neo4j.get_competence.return_value = None
        resp = api.get("/api/competences/cobol/candidats")
        assert resp.status_code == 404 and resp.json() == {"detail": "Compétence non trouvée"}


class TestProjetsByCompetence:  # R7
    def test_projects_come_from_mongo(self, api, repos):
        repos.neo4j.get_competence.return_value = {"skill_slug": "python", "nom": "Python"}
        repos.neo4j.get_projet_slugs_by_competence.return_value = ["smartcity-explorer", "fantome"]
        repos.projet.get_projets_by_slugs.return_value = [PROJET]
        data = api.get("/api/competences/python/projets").json()
        assert [p["projet_slug"] for p in data["projets"]] == ["smartcity-explorer"]
        assert data["projets"][0]["titre"] == "SmartCity Explorer"

    def test_unknown_competence(self, api, repos):
        repos.neo4j.get_competence.return_value = None
        assert api.get("/api/competences/cobol/projets").status_code == 404
