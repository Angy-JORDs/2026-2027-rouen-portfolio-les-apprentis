"""Routes API — Candidats (MongoDB) : R1, R2, R3."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from portfolio_api.db.mongo import get_mongo_db
from portfolio_api.models import CandidatOut, CandidatSummary, Page, ProjetOut, StatsOut
from portfolio_api.repositories.mongo_candidat_repo import MongoCandidatRepository
from portfolio_api.repositories.mongo_projet_repo import MongoProjetRepository
from portfolio_api.services.candidat_service import CandidatService

router = APIRouter(prefix="/candidats", tags=["candidats"])


def _get_service() -> CandidatService:
    db = get_mongo_db()
    return CandidatService(
        candidat_repo=MongoCandidatRepository(db), projet_repo=MongoProjetRepository(db)
    )


@router.get("", response_model=Page[CandidatSummary])
async def list_candidats(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    service: CandidatService = Depends(_get_service),
):
    return await service.search_candidats(page=page, size=size)


@router.get("/{slug}", response_model=CandidatOut)
async def get_candidat(slug: str, service: CandidatService = Depends(_get_service)):
    candidat = await service.get_candidat_detail(slug)
    if candidat is None:
        raise HTTPException(status_code=404, detail="Candidat non trouvé")
    return candidat


@router.get("/{slug}/projets", response_model=Page[ProjetOut])
async def get_candidat_projets(
    slug: str,
    competence: Optional[str] = Query(None, description="Filtre : skill_slug, ex. mongodb"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    service: CandidatService = Depends(_get_service),
):
    result = await service.get_candidat_projets(slug, competence=competence, page=page, size=size)
    if result is None:
        raise HTTPException(status_code=404, detail="Candidat non trouvé")
    return result


@router.get("/{slug}/stats", response_model=StatsOut)
async def get_candidat_stats(slug: str, service: CandidatService = Depends(_get_service)):
    stats = await service.get_candidat_stats(slug)
    if stats is None:
        raise HTTPException(status_code=404, detail="Candidat non trouvé")
    return stats
