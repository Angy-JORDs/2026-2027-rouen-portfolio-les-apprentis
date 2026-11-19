"""Santé : vérifie que l'API joint bien MongoDB et Neo4j avec les identifiants du .env."""

from __future__ import annotations

import asyncio

from fastapi import APIRouter, Response

from portfolio_api.db.mongo import get_mongo_db
from portfolio_api.db.neo4j import get_neo4j_driver
from portfolio_api.models import DbHealthResponse

router = APIRouter(tags=["santé"])


async def ping_mongo() -> None:
    await get_mongo_db().command("ping")


async def ping_neo4j() -> None:
    await get_neo4j_driver().verify_connectivity()  # vérifie aussi l'authentification


async def _status(ping) -> str:
    try:
        await ping()
        return "ok"
    except Exception as exc:  # noqa: BLE001 — on ne renvoie que le type : jamais d'URL ni de mot de passe
        return f"erreur : {type(exc).__name__}"


@router.get(
    "/health/db",
    response_model=DbHealthResponse,
    responses={503: {"model": DbHealthResponse}},
)
async def health_db(response: Response) -> DbHealthResponse:
    mongo, neo4j = await asyncio.gather(_status(ping_mongo), _status(ping_neo4j))
    ok = mongo == "ok" and neo4j == "ok"
    if not ok:
        response.status_code = 503
    return DbHealthResponse(status="ok" if ok else "degraded", mongo=mongo, neo4j=neo4j)
