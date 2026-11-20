"""Service métier — Candidats (liste, R1, R2, R3).

Fait le lien entre les routes et les repositories MongoDB.
Aucune requête Mongo ici : le service assemble, trie et convertit en modèles Pydantic.
Retourne None quand le candidat n'existe pas (la route renvoie alors 404).

Les sous-objets (timeline, statistiques) sont passés en dict : Pydantic les valide
dans les modèles imbriqués, quel que soit le nom choisi pour ces classes.

Méthodes attendues des repositories :
- candidat_repo.get_by_slug(slug) -> dict | None              (projection {"_id": 0})
- candidat_repo.list_candidats(skip, limit) -> (list[dict], int)  (trié par nom, prénom)
- projet_repo.find_by_candidat(slug, competence, skip, limit) -> (list[dict], int)
- projet_repo.count_by_candidat(slug) -> int
- projet_repo.count_competences(slug) -> list[{"skill_slug", "nombre_projets"}]  (agrégation R3, triée)
"""

from __future__ import annotations

from typing import Any, Optional

from portfolio_api.models import CandidatOut, CandidatSummary, Page, ProjetOut, StatsOut


class CandidatService:
    def __init__(self, candidat_repo: Any, projet_repo: Any):
        self.candidat_repo = candidat_repo
        self.projet_repo = projet_repo

    async def search_candidats(self, *, page: int = 1, size: int = 20) -> Page[CandidatSummary]:
        """Liste paginée des candidats."""
        rows, total = await self.candidat_repo.list_candidats(skip=(page - 1) * size, limit=size)
        return Page[CandidatSummary](items=rows, total=total, page=page, size=size)

    async def get_candidat_detail(self, slug: str) -> Optional[CandidatOut]:
        """R1 — profil complet + timeline fusionnée."""
        doc = await self.candidat_repo.get_by_slug(slug)
        if doc is None:
            return None
        return CandidatOut(**{**doc, "timeline": build_timeline(doc)})

    async def get_candidat_projets(
        self, slug: str, *, competence: Optional[str] = None, page: int = 1, size: int = 20
    ) -> Optional[Page[ProjetOut]]:
        """R2 — projets du candidat, filtrables par compétence."""
        if await self.candidat_repo.get_by_slug(slug) is None:
            return None
        rows, total = await self.projet_repo.find_by_candidat(
            slug, competence=competence, skip=(page - 1) * size, limit=size
        )
        return Page[ProjetOut](items=rows, total=total, page=page, size=size)

    async def get_candidat_stats(self, slug: str) -> Optional[StatsOut]:
        """R3 — nombre de projets par compétence (agrégation MongoDB), enrichi des compétences déclarées."""
        doc = await self.candidat_repo.get_by_slug(slug)
        if doc is None:
            return None

        counts = await self.projet_repo.count_competences(slug)
        total = await self.projet_repo.count_by_candidat(slug)
        declared = {c["skill_slug"]: c for c in doc.get("competences") or []}

        competences = []
        for row in counts:
            skill = row["skill_slug"]
            info = declared.get(skill, {})
            competences.append(
                {
                    "skill_slug": skill,
                    "nom": info.get("nom", skill),  # non déclarée -> nom = slug (contrat)
                    "domaine": info.get("domaine"),  # non déclarée -> null
                    "niveau": info.get("niveau"),  # non déclarée -> null
                    "nombre_projets": row["nombre_projets"],
                }
            )
        return StatsOut(candidat_slug=slug, total_projets=total, competences=competences)


def build_timeline(doc: dict) -> list[dict]:
    """Fusionne expériences et formations, de la plus récente à la plus ancienne (tri sur `debut`)."""
    items = [
        {
            "type": "experience",
            "titre": e.get("poste"),
            "organisation": e.get("entreprise"),
            "debut": e.get("debut"),
            "fin": e.get("fin"),
            "description": e.get("description"),
        }
        for e in doc.get("experiences") or []
    ] + [
        {
            "type": "formation",
            "titre": f.get("diplome"),
            "organisation": f.get("ecole"),
            "debut": f.get("debut"),
            "fin": f.get("fin"),
            "description": None,
        }
        for f in doc.get("formations") or []
    ]
    # "AAAA-MM" se trie correctement comme une chaîne ; une date absente passe en dernier
    items.sort(key=lambda i: i["debut"] or "", reverse=True)
    return items
