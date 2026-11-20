"""Tests unitaires — Repository Neo4j (session.run simulée)."""

from __future__ import annotations

from portfolio_api.repositories.neo4j_repo import Neo4jRepository

from .conftest import FakeNeo4jResult


class TestGetProjet:
    async def test_returns_first_record(self, neo4j_driver, neo4j_session):
        neo4j_session.run.return_value = FakeNeo4jResult([{"projet_slug": "p1", "titre": "P1"}])
        result = await Neo4jRepository(neo4j_driver).get_projet("p1")
        assert result == {"projet_slug": "p1", "titre": "P1"}
        assert neo4j_session.run.call_args.kwargs == {"slug": "p1"}

    async def test_returns_none_when_absent(self, neo4j_driver, neo4j_session):
        neo4j_session.run.return_value = FakeNeo4jResult([])
        assert await Neo4jRepository(neo4j_driver).get_projet("zzz") is None


class TestGetSimilarProjets:
    async def test_passes_slug_and_limit_and_returns_records(self, neo4j_driver, neo4j_session):
        records = [
            {"projet_slug": "b", "titre": "B", "competences_communes": 2, "competences": ["python", "neo4j"]}
        ]
        neo4j_session.run.return_value = FakeNeo4jResult(records)

        result = await Neo4jRepository(neo4j_driver).get_similar_projets("a", limit=3)

        assert result == records
        query = neo4j_session.run.call_args.args[0]
        assert "UTILISE" in query and "LIMIT $limit" in query
        assert neo4j_session.run.call_args.kwargs == {"slug": "a", "limit": 3}

    async def test_empty(self, neo4j_driver, neo4j_session):
        neo4j_session.run.return_value = FakeNeo4jResult([])
        assert await Neo4jRepository(neo4j_driver).get_similar_projets("a") == []


class TestProjetSlugsByCompetence:
    async def test_returns_list_of_slugs(self, neo4j_driver, neo4j_session):
        neo4j_session.run.return_value = FakeNeo4jResult([{"projet_slug": "p1"}, {"projet_slug": "p2"}])
        result = await Neo4jRepository(neo4j_driver).get_projet_slugs_by_competence("python")
        assert result == ["p1", "p2"]


class TestDeleteProjet:
    async def test_true_when_node_deleted(self, neo4j_driver, neo4j_session):
        neo4j_session.run.return_value = FakeNeo4jResult(nodes_deleted=1)
        assert await Neo4jRepository(neo4j_driver).delete_projet("p1") is True
        assert "DETACH DELETE" in neo4j_session.run.call_args.args[0]

    async def test_false_when_nothing_deleted(self, neo4j_driver, neo4j_session):
        neo4j_session.run.return_value = FakeNeo4jResult(nodes_deleted=0)
        assert await Neo4jRepository(neo4j_driver).delete_projet("p1") is False
