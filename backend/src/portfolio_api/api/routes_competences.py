"""Routes API — Compétences (Neo4j + MongoDB) : R6, R7."""
 
from __future__ import annotations
 
from fastapi import APIRouter, Depends, HTTPException
 
from portfolio_api.db.mongo import get_mongo_db
from portfolio_api.db.neo4j import get_neo4j_driver
from portfolio_api.models import CompetenceCandidatsOut, CompetenceProjetsOut
from portfolio_api.repositories.mongo_projet_repo import MongoProjetRepository
from portfolio_api.repositories.neo4j_repo import Neo4jRepository
from portfolio_api.services.graph_service import GraphService
 
router = APIRouter(prefix="/competences", tags=["compétences"])
 
 
def _get_service() -> GraphService:
    return GraphService(
        neo4j_repo=Neo4jRepository(get_neo4j_driver()),
        projet_repo=MongoProjetRepository(get_mongo_db()),
    )
 
 
@router.get("/{slug}/candidats", response_model=CompetenceCandidatsOut)
async def get_candidats_by_competence(slug: str, service: GraphService = Depends(_get_service)):
    result = await service.get_candidats_by_competence(slug)
    if result is None:
        raise HTTPException(status_code=404, detail="Compétence non trouvée")
    return result
 
 
@router.get("/{slug}/projets", response_model=CompetenceProjetsOut)
async def get_projets_by_competence(slug: str, service: GraphService = Depends(_get_service)):
    result = await service.get_projets_by_competence(slug)
    if result is None:
        raise HTTPException(status_code=404, detail="Compétence non trouvée")
    return result
 