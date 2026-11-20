"""Routes API — Graphe (Neo4j + MongoDB) : R4 (projets similaires), R5 (graphe d'un candidat)."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from portfolio_api.db.mongo import get_mongo_db
from portfolio_api.db.neo4j import get_neo4j_driver
from portfolio_api.models import GraphOut, SimilairesOut
from portfolio_api.repositories.mongo_projet_repo import MongoProjetRepository
from portfolio_api.repositories.neo4j_repo import Neo4jRepository
from portfolio_api.services.graph_service import GraphService

router = APIRouter(prefix="/graph", tags=["graphe"])


def _get_service() -> GraphService:
    return GraphService(
        neo4j_repo=Neo4jRepository(get_neo4j_driver()),
        projet_repo=MongoProjetRepository(get_mongo_db()),
    )


@router.get("/projets/{slug}/similaires", response_model=SimilairesOut)
async def get_similar_projets(
    slug: str,
    limit: int = Query(5, ge=1, le=50, description="Nombre de projets similaires"),
    service: GraphService = Depends(_get_service),
):
    result = await service.get_similar_projets(slug, limit=limit)
    if result is None:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    return result


@router.get("/competences/{slug}", response_model=GraphOut)
async def get_candidat_graph(slug: str, service: GraphService = Depends(_get_service)):
    """`slug` = candidat_slug : graphe Candidat → Projets → Compétences."""
    graph = await service.get_candidat_graph(slug)
    if graph is None:
        raise HTTPException(status_code=404, detail="Candidat non trouvé")
    return graph
