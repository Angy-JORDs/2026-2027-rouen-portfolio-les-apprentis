"""Tests unitaires — ProjetService (repositories simulés)."""

from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from portfolio_api.services.projet_service import ProjetService

from ..conftest import PROJET


@pytest.fixture
def projet_repo():
    return AsyncMock()


@pytest.fixture
def neo4j_repo():
    return AsyncMock()


@pytest.fixture
def service(projet_repo, neo4j_repo):
    return ProjetService(projet_repo=projet_repo, neo4j_repo=neo4j_repo)


class TestSearchAndDetail:
    async def test_search_normalizes_competence(self, service, projet_repo):
        projet_repo.get_projets.return_value = ([PROJET], 1)
        result = await service.search_projets(competence="Python", page=1, size=20)
        assert result.total == 1 and result.items[0].projet_slug == "smartcity-explorer"
        projet_repo.get_projets.assert_awaited_once_with(competence="python", page=1, size=20)

    async def test_detail_none_when_absent(self, service, projet_repo):
        projet_repo.get_projet_by_slug.return_value = None
        assert await service.get_projet_detail("x") is None


class TestDeleteProjet:
    async def test_deletes_in_both_databases(self, service, projet_repo, neo4j_repo):
        projet_repo.delete_projet.return_value = True
        neo4j_repo.delete_projet.return_value = True
        assert await service.delete_projet("p1") is True
        projet_repo.delete_projet.assert_awaited_once_with("p1")
        neo4j_repo.delete_projet.assert_awaited_once_with("p1")

    async def test_resumes_when_only_neo4j_still_has_it(self, service, projet_repo, neo4j_repo):
        projet_repo.delete_projet.return_value = False
        neo4j_repo.delete_projet.return_value = True
        assert await service.delete_projet("p1") is True

    async def test_false_when_in_neither_database(self, service, projet_repo, neo4j_repo):
        projet_repo.delete_projet.return_value = False
        neo4j_repo.delete_projet.return_value = False
        assert await service.delete_projet("p1") is False
