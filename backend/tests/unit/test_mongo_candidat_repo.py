"""Tests unitaires — Repository MongoDB Candidats."""

from __future__ import annotations

import pytest

from portfolio_api.repositories.mongo_candidat_repo import MongoCandidatRepository

from .conftest import FakeCursor


@pytest.fixture
def repo(mongo_db):
    return MongoCandidatRepository(mongo_db)


class TestGetCandidatBySlug:
    async def test_returns_dict_without_mongo_id(self, repo, mongo_collection):
        mongo_collection.find_one.return_value = {
            "_id": "mongo_id_1",
            "candidat_slug": "alice-martin",
            "prenom": "Alice",
            "nom": "Martin",
            "experiences": [{"poste": "Stagiaire"}],
        }
        result = await repo.get_candidat_by_slug("alice-martin")

        assert result["prenom"] == "Alice"
        assert "_id" not in result
        assert "experiences" in result  # embedding : tout vient en une seule requête
        mongo_collection.find_one.assert_awaited_once_with({"candidat_slug": "alice-martin"})

    async def test_returns_none_when_not_found(self, repo, mongo_collection):
        mongo_collection.find_one.return_value = None
        assert await repo.get_candidat_by_slug("personne") is None


class TestGetCandidats:
    async def test_returns_list_and_total_without_ids(self, repo, mongo_collection):
        mongo_collection.count_documents.return_value = 4
        mongo_collection.find.return_value = FakeCursor(
            [
                {"_id": "1", "candidat_slug": "a", "prenom": "A", "nom": "A"},
                {"_id": "2", "candidat_slug": "b", "prenom": "B", "nom": "B"},
            ]
        )
        rows, total = await repo.get_candidats(page=1, size=2)

        assert total == 4
        assert [r["candidat_slug"] for r in rows] == ["a", "b"]
        assert all("_id" not in r for r in rows)
