"""Normalisation des slugs pivots (candidat_slug, projet_slug, skill_slug).

Règle du contrat (API_ROUTES.md) : les slugs sont en minuscules. On retire aussi les espaces
autour, pour que " MongoDB " (saisie d'un membre ou paramètre d'URL) désigne la même
compétence que "mongodb" dans MongoDB comme dans Neo4j.
"""

from __future__ import annotations

from typing import Any, Optional


def normalize_slug(value: Any) -> Optional[str]:
    """Exemples : ' MongoDB ' -> 'mongodb' ; None, '' ou '   ' -> None."""
    if value is None:
        return None
    slug = str(value).strip().lower()
    return slug or None
