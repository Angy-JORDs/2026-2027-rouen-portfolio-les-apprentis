"""Tests unitaires — Repository MongoDB Projets."""

from __future__ import annotations

import pytest

from portfolio_api.repositories.mongo_projet_repo import MongoProjetRepository

from .conftest import FakeAggregationCursor, FakeCursor, FakeDeleteResult


@pytest.fixture
def repo(mongo_db):
    return MongoProjetRepository(mongo_db)


class TestGetProjets:
    async def test_filters_by_author_and_competence(self, repo, mongo_collection):
        mongo_collection.count_documents.return_value = 1
        mongo_collection.find.return_value = FakeCursor([{"_id": "x", "projet_slug": "p1"}])

        rows, total = await repo.get_projets(
            candidat_slug="alice-martin", competence="mongodb", page=1, size=20
        )

        expected = {"candidat_slugs": "alice-martin", "competences": "mongodb"}
        mongo_collection.count_documents.assert_awaited_once_with(expected)
        mongo_collection.find.assert_called_once_with(expected)
        assert total == 1 and rows == [{"projet_slug": "p1"}]  # _id retiré

    async def test_no_filter_gives_empty_query(self, repo, mongo_collection):
        await repo.get_projets()
        mongo_collection.count_documents.assert_awaited_once_with({})


class TestGetProjetBySlug:
    async def test_found(self, repo, mongo_collection):
        mongo_collection.find_one.return_value = {"_id": "x", "projet_slug": "p1", "titre": "P1"}
        assert await repo.get_projet_by_slug("p1") == {"projet_slug": "p1", "titre": "P1"}

    async def test_not_found(self, repo, mongo_collection):
        assert await repo.get_projet_by_slug("nope") is None


class TestGetProjetsBySlugs:
    async def test_uses_in_operator(self, repo, mongo_collection):
        mongo_collection.find.return_value = FakeCursor([{"_id": "x", "projet_slug": "p1"}])
        rows = await repo.get_projets_by_slugs(["p1", "p2"])
        mongo_collection.find.assert_called_once_with({"projet_slug": {"$in": ["p1", "p2"]}})
        assert rows == [{"projet_slug": "p1"}]

    async def test_empty_list_skips_database(self, repo, mongo_collection):
        assert await repo.get_projets_by_slugs([]) == []
        mongo_collection.find.assert_not_called()


class TestCompetenceStats:
    async def test_runs_pipeline_and_returns_rows(self, repo, mongo_collection):
        rows = [{"skill_slug": "python", "nombre_projets": 3}]
        mongo_collection.aggregate.return_value = FakeAggregationCursor(rows)

        result = await repo.get_competence_stats("alice-martin")

        pipeline = mongo_collection.aggregate.call_args.args[0]
        assert pipeline[0] == {"$match": {"candidat_slugs": "alice-martin"}}
        assert pipeline[1] == {"$unwind": "$competences"}
        assert "$group" in pipeline[2]
        assert result == rows


class TestDeleteProjet:
    @pytest.mark.parametrize("count,expected", [(1, True), (0, False)])
    async def test_returns_true_only_if_deleted(self, repo, mongo_collection, count, expected):
        mongo_collection.delete_one.return_value = FakeDeleteResult(count)
        assert await repo.delete_projet("p1") is expected
        mongo_collection.delete_one.assert_awaited_once_with({"projet_slug": "p1"})
