"""Schémas de réponse de l'API (contrat avec les frontends, cf. API_ROUTES.md)."""

from __future__ import annotations

from typing import Any, Generic, Literal, TypeVar

from pydantic import BaseModel, Field

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """Enveloppe de pagination : ?page=1&size=20."""

    items: list[T]
    total: int
    page: int
    size: int


# ---------------------------------------------------------------- Candidats (MongoDB)
class ExperienceOut(BaseModel):
    entreprise: str
    poste: str
    debut: str | None = None
    fin: str | None = None
    description: str | None = None
    competences: list[str] = Field(default_factory=list)


class FormationOut(BaseModel):
    ecole: str
    diplome: str
    debut: str | None = None
    fin: str | None = None


class CompetenceOut(BaseModel):
    skill_slug: str
    nom: str
    domaine: str | None = None
    niveau: int | None = None


class TimelineItem(BaseModel):
    """Entrée de la frise chronologique (expériences + formations fusionnées)."""

    type: Literal["experience", "formation"]
    titre: str
    organisation: str
    debut: str | None = None
    fin: str | None = None
    description: str | None = None


class CandidatSummary(BaseModel):
    candidat_slug: str
    prenom: str
    nom: str
    titre: str | None = None


class CandidatOut(CandidatSummary):
    bio: str | None = None
    liens: dict[str, str] = Field(default_factory=dict)
    experiences: list[ExperienceOut] = Field(default_factory=list)
    formations: list[FormationOut] = Field(default_factory=list)
    competences: list[CompetenceOut] = Field(default_factory=list)
    timeline: list[TimelineItem] = Field(default_factory=list)


# ---------------------------------------------------------------- Projets (MongoDB)
class ProjetOut(BaseModel):
    projet_slug: str
    candidat_slugs: list[str] = Field(default_factory=list)
    titre: str
    contexte: str | None = None
    description: str | None = None
    date_debut: str | None = None
    date_fin: str | None = None
    competences: list[str] = Field(default_factory=list)
    metriques: dict[str, Any] = Field(default_factory=dict)
    liens: dict[str, str] = Field(default_factory=dict)
    images: list[str] = Field(default_factory=list)


class StatCompetence(BaseModel):
    skill_slug: str
    nom: str
    domaine: str | None = None
    niveau: int | None = None
    nombre_projets: int


class StatsOut(BaseModel):
    candidat_slug: str
    total_projets: int
    competences: list[StatCompetence]


# ---------------------------------------------------------------- Graphe (Neo4j)
class SimilarProjetOut(BaseModel):
    projet_slug: str
    titre: str
    competences_communes: int
    competences: list[str]


class SimilairesOut(BaseModel):
    projet_slug: str
    similaires: list[SimilarProjetOut]


class GraphNode(BaseModel):
    id: str  # "candidat:<slug>" | "projet:<slug>" | "competence:<slug>" (unique dans le graphe)
    type: Literal["candidat", "projet", "competence"]
    slug: str
    label: str


class GraphLink(BaseModel):
    source: str  # id d'un nœud
    target: str  # id d'un nœud
    type: Literal["REALISE", "UTILISE"]


class GraphOut(BaseModel):
    nodes: list[GraphNode]
    links: list[GraphLink]


class CandidatRef(BaseModel):
    candidat_slug: str
    prenom: str
    nom: str


class CandidatParCompetence(CandidatRef):
    nb_projets: int  # nombre de projets du candidat qui utilisent la compétence


class CompetenceCandidatsOut(BaseModel):
    skill_slug: str
    nom: str
    candidats: list[CandidatParCompetence]


class CompetenceProjetsOut(BaseModel):
    skill_slug: str
    nom: str
    projets: list[ProjetOut]


# ---------------------------------------------------------------- Santé
class DbHealthResponse(BaseModel):
    status: Literal["ok", "degraded"]
    mongo: str  # "ok" ou "erreur : <type d'exception>" (jamais d'URL ni d'identifiant)
    neo4j: str
