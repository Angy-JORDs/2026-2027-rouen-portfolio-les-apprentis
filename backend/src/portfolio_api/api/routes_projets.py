"""Routes API — Projets (MongoDB ; + Neo4j pour la suppression) : galerie, R8 (fiche détaillée), suppression."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from portfolio_api.db.mongo import get_mongo_db
from portfolio_api.db.neo4j import get_neo4j_driver
from portfolio_api.models import Page, ProjetOut
from portfolio_api.repositories.mongo_projet_repo import MongoProjetRepository
from portfolio_api.repositories.neo4j_repo import Neo4jRepository
from portfolio_api.services.projet_service import ProjetService

router = APIRouter(prefix="/projets", tags=["projets"])


def _get_service() -> ProjetService:
    return ProjetService(
        projet_repo=MongoProjetRepository(get_mongo_db()),
        neo4j_repo=Neo4jRepository(get_neo4j_driver()),
    )


@router.get("", response_model=Page[ProjetOut])
async def list_projets(
    competence: Optional[str] = Query(None, description="Filtre : skill_slug, ex. mongodb"),
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    service: ProjetService = Depends(_get_service),
):
    return await service.search_projets(competence=competence, page=page, size=size)


@router.get("/{slug}", response_model=ProjetOut)
async def get_projet(slug: str, service: ProjetService = Depends(_get_service)):
    """R8 — fiche détaillée d'un projet."""
    projet = await service.get_projet_detail(slug)
    if projet is None:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    return projet


@router.delete("/{slug}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_projet(slug: str, service: ProjetService = Depends(_get_service)) -> Response:
    if not await service.delete_projet(slug):
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
