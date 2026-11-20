"""Tests unitaires — CandidatService (repositories simulés avec AsyncMock)."""

from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from portfolio_api.models import CandidatOut, Page
from portfolio_api.services.candidat_service import CandidatService, build_timeline

from ..conftest import CANDIDAT, PROJET


@pytest.fixture
def candidat_repo():
    return AsyncMock()


@pytest.fixture
def projet_repo():
    return AsyncMock()


@pytest.fixture
def service(candidat_repo, projet_repo):
    return CandidatService(candidat_repo=candidat_repo, projet_repo=projet_repo)


class TestTimeline:
    def test_most_recent_first_and_typed(self):
        timeline = build_timeline(CANDIDAT)
        assert [t["type"] for t in timeline] == ["experience", "formation"]  # 2026-04 avant 2024-09
        assert timeline[0]["organisation"] == "Entreprise X"
        assert timeline[1]["titre"] == "Cycle ingénieur"

    def test_missing_date_goes_last(self):
        doc = {"experiences": [{"poste": "A", "entreprise": "X"}], "formations": CANDIDAT["formations"]}
        assert build_timeline(doc)[-1]["titre"] == "A"


class TestGetCandidatDetail:
    async def test_returns_none_when_not_found(self, service, candidat_repo):
        candidat_repo.get_candidat_by_slug.return_value = None
        assert await service.get_candidat_detail("x") is None

    async def test_returns_candidat_with_timeline(self, service, candidat_repo):
        candidat_repo.get_candidat_by_slug.return_value = CANDIDAT
        result = await service.get_candidat_detail("alice-martin")
        assert isinstance(result, CandidatOut)
        assert len(result.timeline) == 2 and len(result.experiences) == 1


class TestGetCandidatProjets:
    async def test_returns_none_when_candidat_unknown(self, service, candidat_repo, projet_repo):
        candidat_repo.get_candidat_by_slug.return_value = None
        assert await service.get_candidat_projets("x") is None
        projet_repo.get_projets.assert_not_called()

    async def test_normalizes_competence_filter(self, service, candidat_repo, projet_repo):
        candidat_repo.get_candidat_by_slug.return_value = CANDIDAT
        projet_repo.get_projets.return_value = ([PROJET], 1)

        result = await service.get_candidat_projets("alice-martin", competence=" MongoDB ", page=2, size=5)

        assert isinstance(result, Page) and result.total == 1 and result.page == 2
        projet_repo.get_projets.assert_awaited_once_with(
            candidat_slug="alice-martin", competence="mongodb", page=2, size=5
        )


class TestGetCandidatStats:
    async def test_returns_none_when_not_found(self, service, candidat_repo):
        candidat_repo.get_candidat_by_slug.return_value = None
        assert await service.get_candidat_stats("x") is None

    async def test_enriches_rows_with_declared_skills(self, service, candidat_repo, projet_repo):
        candidat_repo.get_candidat_by_slug.return_value = CANDIDAT
        projet_repo.get_competence_stats.return_value = [
            {"skill_slug": "python", "nombre_projets": 3},
            {"skill_slug": "fastapi", "nombre_projets": 1},  # non déclarée par le candidat
        ]
        projet_repo.count_projets_candidat.return_value = 3

        result = await service.get_candidat_stats("alice-martin")

        assert result.total_projets == 3
        python, fastapi = result.competences
        assert (python.nom, python.domaine, python.niveau) == ("Python", "langages", 4)
        assert (fastapi.nom, fastapi.niveau) == ("fastapi", None)
