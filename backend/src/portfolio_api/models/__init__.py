"""Modèles Pydantic — reflètent les payloads de API_ROUTES.md."""

from __future__ import annotations

from pydantic import BaseModel

from portfolio_api.models.schemas import (  # noqa: F401
    CandidatOut,
    CandidatParCompetence,
    CandidatRef,
    CandidatSummary,
    CompetenceCandidatsOut,
    CompetenceOut,
    CompetenceProjetsOut,
    DbHealthResponse,
    ExperienceOut,
    FormationOut,
    GraphLink,
    GraphNode,
    GraphOut,
    Page,
    ProjetOut,
    SimilairesOut,
    SimilarProjetOut,
    StatCompetence,
    StatsOut,
    TimelineItem,
)


class HealthResponse(BaseModel):
    status: str = "ok"
