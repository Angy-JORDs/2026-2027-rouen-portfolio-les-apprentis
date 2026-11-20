"""Portfolio Polyglotte — application FastAPI."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from neo4j.exceptions import ServiceUnavailable
from pymongo.errors import ServerSelectionTimeoutError

from portfolio_api.api.routes_candidats import router as candidats_router
from portfolio_api.api.routes_competences import router as competences_router
from portfolio_api.api.routes_graph import router as graph_router
from portfolio_api.api.routes_health import router as health_router
from portfolio_api.api.routes_projets import router as projets_router
from portfolio_api.core.config import get_settings
from portfolio_api.core.logging import setup_logging
from portfolio_api.db.mongo import close_mongo
from portfolio_api.db.neo4j import close_neo4j
from portfolio_api.models import HealthResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    yield
    await close_mongo()
    await close_neo4j()


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="API d'équipe du Portfolio Polyglotte — voir API_ROUTES.md",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Error handlers ─────────────────────────────────────────────
@app.exception_handler(ServerSelectionTimeoutError)
@app.exception_handler(ServiceUnavailable)
async def db_unavailable_handler(request: Request, exc: Exception):
    """MongoDB ou Neo4j injoignable -> 503 explicite."""
    logging.getLogger("portfolio_api").error("Base indisponible : %s", type(exc).__name__)
    return JSONResponse(
        status_code=503,
        content={"detail": "Base de données indisponible (just up ? identifiants du .env ?)"},
    )


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    """Catch-all : erreurs non gérées → 500 propre."""
    logging.getLogger("portfolio_api").error("Unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


# ── Routes ─────────────────────────────────────────────────────
@app.get("/api/health", response_model=HealthResponse, tags=["santé"])
async def health() -> HealthResponse:
    return HealthResponse()


for _router in (health_router, candidats_router, projets_router, competences_router, graph_router):
    app.include_router(_router, prefix="/api")