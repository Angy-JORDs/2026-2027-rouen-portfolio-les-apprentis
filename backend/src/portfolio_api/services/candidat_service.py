"""Service métier — Candidats (R1 profil + timeline, R2 projets, R3 stats) : MongoDB.

Le service fait le lien entre les routes API et les repositories. Il renvoie `None` quand la
ressource n'existe pas : c'est la route qui répond 404 (comme `CityService` dans SmartCity).
"""

from __future__ import annotations

from typing import Any, Optional

from portfolio_api.models import (
    CandidatOut,
    CandidatSummary,
    Page,
    ProjetOut,
    StatCompetence,
    StatsOut,
)


def build_timeline(doc: dict) -> list[dict]:
    """Fusionne expériences et formations en une frise, de la plus récente à la plus ancienne."""
    items = [
        {
            "type": "experience",
            "titre": e.get("poste", ""),
            "organisation": e.get("entreprise", ""),
            "debut": e.get("debut"),
            "fin": e.get("fin"),
            "description": e.get("description"),
        }
        for e in doc.get("experiences", [])
    ] + [
        {
            "type": "formation",
            "titre": f.get("diplome", ""),
            "organisation": f.get("ecole", ""),
            "debut": f.get("debut"),
            "fin": f.get("fin"),
            "description": None,
        }
        for f in doc.get("formations", [])
    ]
    # "AAAA-MM" se trie lexicographiquement ; une date absente passe en dernier.
    return sorted(items, key=lambda i: i["debut"] or "", reverse=True)


class CandidatService:
    def __init__(self, candidat_repo: Any, projet_repo: Any):
        self.candidat_repo = candidat_repo
        self.projet_repo = projet_repo

    async def search_candidats(self, *, page: int = 1, size: int = 20) -> Page[CandidatSummary]:
        rows, total = await self.candidat_repo.get_candidats(page=page, size=size)
        candidats = [CandidatSummary(**row) for row in rows]
        return Page(items=candidats, total=total, page=page, size=size)

    async def get_candidat_detail(self, slug: str) -> Optional[CandidatOut]:
        """R1 — profil complet + timeline, ou None si le candidat n'existe pas."""
        row = await self.candidat_repo.get_candidat_by_slug(slug)
        if row is None:
            return None
        return CandidatOut(**{**row, "timeline": build_timeline(row)})

    async def get_candidat_projets(
        self,
        slug: str,
        *,
        competence: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> Optional[Page[ProjetOut]]:
        """R2 — projets du candidat (filtre `competence` optionnel), ou None si candidat inconnu."""
        if await self.candidat_repo.get_candidat_by_slug(slug) is None:
            return None

        competence = competence.strip().lower() if competence else None
        rows, total = await self.projet_repo.get_projets(
            candidat_slug=slug, competence=competence, page=page, size=size
        )
        projets = [ProjetOut(**row) for row in rows]
        return Page(items=projets, total=total, page=page, size=size)

    async def get_candidat_stats(self, slug: str) -> Optional[StatsOut]:
        """R3 — nombre de projets par compétence, enrichi avec nom/domaine/niveau du candidat."""
        candidat = await self.candidat_repo.get_candidat_by_slug(slug)
        if candidat is None:
            return None

        rows = await self.projet_repo.get_competence_stats(slug)
        total = await self.projet_repo.count_projets_candidat(slug)

        declarees = {c["skill_slug"]: c for c in candidat.get("competences", [])}
        competences = []
        for row in rows:
            meta = declarees.get(row["skill_slug"], {})
            competences.append(
                StatCompetence(
                    skill_slug=row["skill_slug"],
                    nom=meta.get("nom", row["skill_slug"]),
                    domaine=meta.get("domaine"),
                    niveau=meta.get("niveau"),
                    nombre_projets=row["nombre_projets"],
                )
            )
        return StatsOut(candidat_slug=slug, total_projets=total, competences=competences)