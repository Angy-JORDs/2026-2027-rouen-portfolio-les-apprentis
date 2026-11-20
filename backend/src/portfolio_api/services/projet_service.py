"""Service métier — Projets (MongoDB ; + Neo4j pour la suppression) : galerie, R8, DELETE.

Retourne None / False si le projet n'existe pas (la route renvoie alors 404).

Repositories utilisés (repositories/mongo_projet_repo.py, repositories/neo4j_repo.py) :
- projet_repo.get_projets(competence, page, size) / get_projet_by_slug(slug) / delete_projet(slug)
- neo4j_repo.delete_projet(slug)
"""

from __future__ import annotations

from typing import Any, Optional

from portfolio_api.core.slugs import normalize_slug
from portfolio_api.models import Page, ProjetOut


class ProjetService:
    def __init__(self, projet_repo: Any, neo4j_repo: Any):
        self.projet_repo = projet_repo
        self.neo4j_repo = neo4j_repo

    async def search_projets(
        self, *, competence: Optional[str] = None, page: int = 1, size: int = 20
    ) -> Page[ProjetOut]:
        """Galerie de tous les projets, filtrable par compétence (" Python " -> "python")."""
        rows, total = await self.projet_repo.get_projets(
            competence=normalize_slug(competence), page=page, size=size
        )
        return Page[ProjetOut](items=rows, total=total, page=page, size=size)

    async def get_projet_detail(self, slug: str) -> Optional[ProjetOut]:
        """R8 — fiche détaillée d'un projet."""
        doc = await self.projet_repo.get_projet_by_slug(slug)
        return None if doc is None else ProjetOut(**doc)

    async def delete_projet(self, slug: str) -> bool:
        """Supprime le projet dans MongoDB ET Neo4j.

        Rejouable : les deux suppressions sont toujours tentées, de sorte qu'un projet resté
        dans une seule base (suppression précédente interrompue) finit par disparaître des deux.
        Retourne False seulement si le projet n'existait dans aucune base (-> 404).
        """
        deleted_mongo = await self.projet_repo.delete_projet(slug)
        deleted_neo4j = await self.neo4j_repo.delete_projet(slug)
        return deleted_mongo or deleted_neo4j
