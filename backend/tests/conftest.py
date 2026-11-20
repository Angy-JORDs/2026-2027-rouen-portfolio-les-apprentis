"""Configuration pytest — fixtures partagées."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from portfolio_api.api import routes_candidats, routes_competences, routes_graph, routes_projets
from portfolio_api.main import app
from portfolio_api.services.candidat_service import CandidatService
from portfolio_api.services.graph_service import GraphService
from portfolio_api.services.projet_service import ProjetService

CANDIDAT = {
    "candidat_slug": "alice-martin",
    "prenom": "Alice",
    "nom": "Martin",
    "titre": "Élève-ingénieure Big Data",
    "bio": "Passionnée par les données.",
    "liens": {"github": "https://github.com/alice"},
    "experiences": [
        {
            "entreprise": "Entreprise X",
            "poste": "Stagiaire Data Engineer",
            "debut": "2026-04",
            "fin": "2026-08",
            "description": "Pipeline d'ingestion",
            "competences": ["python"],
        }
    ],
    "formations": [
        {"ecole": "ESIGELEC", "diplome": "Cycle ingénieur", "debut": "2024-09", "fin": "2027-06"}
    ],
    "competences": [
        {"skill_slug": "python", "nom": "Python", "domaine": "langages", "niveau": 4},
        {"skill_slug": "mongodb", "nom": "MongoDB", "domaine": "bases-de-donnees", "niveau": 3},
    ],
}

PROJET = {
    "projet_slug": "smartcity-explorer",
    "candidat_slugs": ["alice-martin"],
    "titre": "SmartCity Explorer",
    "description": "API polyglotte",
    "competences": ["python", "mongodb"],
}


@pytest.fixture(scope="session")
def client():
    """Client de test FastAPI (synchrone), sans surcharge des dépendances.

    raise_server_exceptions=False : les erreurs serveur (ex. DB indisponible) sont retournées
    comme des réponses HTTP 5xx au lieu de lever une exception dans le test.
    """
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


@pytest.fixture
def repos() -> SimpleNamespace:
    """Repositories simulés (aucune base nécessaire)."""
    return SimpleNamespace(candidat=AsyncMock(), projet=AsyncMock(), neo4j=AsyncMock())


@pytest.fixture
def api(repos):
    """Client dont les VRAIS services sont branchés sur des repositories simulés (Depends overrides)."""
    app.dependency_overrides[routes_candidats._get_service] = lambda: CandidatService(
        candidat_repo=repos.candidat, projet_repo=repos.projet
    )
    app.dependency_overrides[routes_projets._get_service] = lambda: ProjetService(
        projet_repo=repos.projet, neo4j_repo=repos.neo4j
    )
    graph = lambda: GraphService(neo4j_repo=repos.neo4j, projet_repo=repos.projet)  # noqa: E731
    app.dependency_overrides[routes_graph._get_service] = graph
    app.dependency_overrides[routes_competences._get_service] = graph
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
