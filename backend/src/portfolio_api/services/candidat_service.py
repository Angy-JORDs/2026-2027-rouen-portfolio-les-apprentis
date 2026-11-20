"""Peuple MongoDB et Neo4j avec les VRAIES données de tous les membres (dossier data/).

Exigences (évaluées au Jalon 2) :
- 1 seule commande : `just seed`
- idempotent : relancer le seed ne crée pas de doublons (les deux bases sont reconstruites depuis data/)
- reproductible sur une machine neuve après `just up`
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path

from portfolio_api.db.mongo import close_mongo, get_mongo_db
from portfolio_api.db.neo4j import close_neo4j, get_neo4j_driver

DATA_DIR = Path(__file__).resolve().parents[4] / "data"


class CandidatService:
    def __init__(self, candidat_repo: Any, projet_repo: Any):
        self.candidat_repo = candidat_repo
        self.projet_repo = projet_repo

    async def search_candidats(self, *, page: int = 1, size: int = 20) -> Page[CandidatSummary]:
        """Liste paginée des candidats."""
        rows, total = await self.candidat_repo.get_candidats(skip=(page - 1) * size, limit=size)
        return Page[CandidatSummary](items=rows, total=total, page=page, size=size)

    async def get_candidat_detail(self, slug: str) -> Optional[CandidatOut]:
        """R1 — profil complet + timeline fusionnée."""
        doc = await self.candidat_repo.get_candidat_by_slug(slug)
        if doc is None:
            return None
        return CandidatOut(**{**doc, "timeline": build_timeline(doc)})

    async def get_candidat_projets(
        self, slug: str, *, competence: Optional[str] = None, page: int = 1, size: int = 20
    ) -> Optional[Page[ProjetOut]]:
        """R2 — projets du candidat, filtrables par compétence (" MongoDB " -> "mongodb")."""
        if await self.candidat_repo.get_candidat_by_slug(slug) is None:
            return None
        rows, total = await self.projet_repo.get_projets(
            candidat_slug=slug, competence=normalize_slug(competence), page=page, size=size
        )
        return Page[ProjetOut](items=rows, total=total, page=page, size=size)

    async def get_candidat_stats(self, slug: str) -> Optional[StatsOut]:
        """R3 — nombre de projets par compétence (agrégation MongoDB), enrichi des compétences déclarées."""
        doc = await self.candidat_repo.get_candidat_by_slug(slug)
        if doc is None:
            return None

        counts = await self.projet_repo.get_competence_stats(slug)
        total = await self.projet_repo.count_projets_candidat(slug)
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


# ------------------------------------------------------------------ normalisation
# Les slugs sont les pivots entre MongoDB et Neo4j : on les normalise UNE fois ici
# pour que les deux bases contiennent exactement les mêmes valeurs.
def norm_slug(value: str) -> str:
    return value.strip().lower()


def _dedupe(values: list[str]) -> list[str]:
    return list(dict.fromkeys(values))  # garde l'ordre


def normalize_candidat(doc: dict) -> dict:
    if not doc.get("candidat_slug"):
        raise ValueError(f"Candidat sans 'candidat_slug' : {doc.get('prenom')} {doc.get('nom')}")
    out = {**doc, "candidat_slug": norm_slug(doc["candidat_slug"])}
    out["competences"] = [
        {**c, "skill_slug": norm_slug(c["skill_slug"])} for c in doc.get("competences", [])
    ]
    out["experiences"] = [
        {**e, "competences": _dedupe([norm_slug(s) for s in e.get("competences", [])])}
        for e in doc.get("experiences", [])
    ]
    return out


def normalize_projet(doc: dict) -> dict:
    if not doc.get("projet_slug"):
        raise ValueError(f"Projet sans 'projet_slug' : {doc.get('titre')}")
    out = {k: v for k, v in doc.items() if k != "candidat_slug"}
    slugs = doc.get("candidat_slugs")
    if slugs is None:  # tolère l'ancien format à un seul auteur (candidat_slug)
        slugs = [doc["candidat_slug"]] if doc.get("candidat_slug") else []
    out["projet_slug"] = norm_slug(doc["projet_slug"])
    out["candidat_slugs"] = _dedupe([norm_slug(s) for s in slugs])
    out["competences"] = _dedupe([norm_slug(s) for s in doc.get("competences", [])])
    return out


def prepare(candidats: list[dict], projets: list[dict]) -> tuple[list[dict], list[dict], list[str]]:
    """Normalise, refuse les doublons de slug, et renvoie aussi les avertissements."""
    candidats = [normalize_candidat(c) for c in candidats]
    projets = [normalize_projet(p) for p in projets]

    for label, key, docs in (
        ("candidat", "candidat_slug", candidats),
        ("projet", "projet_slug", projets),
    ):
        seen: set[str] = set()
        for d in docs:
            if d[key] in seen:
                raise ValueError(f"Slug de {label} en double : '{d[key]}' (vérifiez data/)")
            seen.add(d[key])

    known = {c["candidat_slug"] for c in candidats}
    warnings = [
        f"projet '{p['projet_slug']}' référence un candidat inconnu : '{s}'"
        for p in projets
        for s in p["candidat_slugs"]
        if s not in known
    ]
    return candidats, projets, warnings


def build_competence_rows(candidats: list[dict], projets: list[dict]) -> list[dict]:
    """Nœuds Competence : métadonnées des candidats d'abord, puis compétences vues seulement dans des projets."""
    rows: dict[str, dict] = {}
    for c in candidats:
        for comp in c["competences"]:
            rows.setdefault(
                comp["skill_slug"],
                {
                    "skill_slug": comp["skill_slug"],
                    "nom": comp.get("nom", comp["skill_slug"]),
                    "domaine": comp.get("domaine"),
                },
            )
    for p in projets:
        for slug in p["competences"]:
            rows.setdefault(slug, {"skill_slug": slug, "nom": slug, "domaine": None})
    return list(rows.values())


# ------------------------------------------------------------------ MongoDB
async def seed_mongo(candidats: list[dict], projets: list[dict]) -> None:
    db = get_mongo_db()
    col_candidats = db["candidats"]
    col_projets = db["projets"]

    await col_candidats.create_index("candidat_slug", unique=True)
    await col_projets.create_index("projet_slug", unique=True)
    await col_projets.create_index("candidat_slugs")
    await col_projets.create_index("competences")

    # Reconstruction complète : relancer le seed ne peut pas créer de doublons.
    await col_candidats.delete_many({})
    await col_projets.delete_many({})
    if candidats:
        await col_candidats.insert_many([dict(c) for c in candidats])  # copies : Mongo ajoute _id
    if projets:
        await col_projets.insert_many([dict(p) for p in projets])
    print("[seed] MongoDB — OK")


# ------------------------------------------------------------------ Neo4j
CONSTRAINTS = [
    "CREATE CONSTRAINT candidat_slug_unique IF NOT EXISTS FOR (c:Candidat) REQUIRE c.candidat_slug IS UNIQUE",
    "CREATE CONSTRAINT projet_slug_unique IF NOT EXISTS FOR (p:Projet) REQUIRE p.projet_slug IS UNIQUE",
    "CREATE CONSTRAINT skill_slug_unique IF NOT EXISTS FOR (s:Competence) REQUIRE s.skill_slug IS UNIQUE",
]

CYPHER_CANDIDATS = """
UNWIND $rows AS row
MERGE (c:Candidat {candidat_slug: row.candidat_slug})
SET c.prenom = row.prenom, c.nom = row.nom
"""

CYPHER_PROJETS = """
UNWIND $rows AS row
MERGE (p:Projet {projet_slug: row.projet_slug})
SET p.titre = row.titre, p.description = row.description
"""

CYPHER_COMPETENCES = """
UNWIND $rows AS row
MERGE (s:Competence {skill_slug: row.skill_slug})
SET s.nom = row.nom, s.domaine = row.domaine
"""

CYPHER_REALISE = """
UNWIND $rows AS row
MATCH (c:Candidat {candidat_slug: row.candidat_slug})
MATCH (p:Projet {projet_slug: row.projet_slug})
MERGE (c)-[:REALISE]->(p)
"""

CYPHER_UTILISE = """
UNWIND $rows AS row
MATCH (p:Projet {projet_slug: row.projet_slug})
MATCH (s:Competence {skill_slug: row.skill_slug})
MERGE (p)-[:UTILISE]->(s)
"""


async def _run(session, query: str, **params) -> None:
    result = await session.run(query, **params)
    await result.consume()  # exécute réellement la requête avant de passer à la suivante


async def seed_neo4j(candidats: list[dict], projets: list[dict]) -> None:
    driver = get_neo4j_driver()

    async with driver.session() as session:
        for statement in CONSTRAINTS:
            await _run(session, statement)

        # Le graphe est dérivé de data/ : on repart de zéro puis on MERGE (idempotent).
        await _run(session, "MATCH (n:Candidat|Projet|Competence) DETACH DELETE n")

        await _run(
            session,
            CYPHER_CANDIDATS,
            rows=[
                {"candidat_slug": c["candidat_slug"], "prenom": c.get("prenom"), "nom": c.get("nom")}
                for c in candidats
            ],
        )
        await _run(
            session,
            CYPHER_PROJETS,
            rows=[
                {"projet_slug": p["projet_slug"], "titre": p.get("titre"), "description": p.get("description")}
                for p in projets
            ],
        )
        await _run(session, CYPHER_COMPETENCES, rows=build_competence_rows(candidats, projets))
        await _run(
            session,
            CYPHER_REALISE,
            rows=[
                {"candidat_slug": c, "projet_slug": p["projet_slug"]}
                for p in projets
                for c in p["candidat_slugs"]
            ],
        )
        await _run(
            session,
            CYPHER_UTILISE,
            rows=[
                {"projet_slug": p["projet_slug"], "skill_slug": s}
                for p in projets
                for s in p["competences"]
            ],
        )
    print("[seed] Neo4j — OK")


async def main() -> None:
    candidats, projets, warnings = prepare(
        load_member_files("candidats"), load_member_files("projets")
    )
    print(f"[seed] {len(candidats)} candidat(s), {len(projets)} projet(s) trouvés dans {DATA_DIR}")
    for w in warnings:
        print(f"[seed] ⚠️  {w}")
    try:
        await seed_mongo(candidats, projets)
        await seed_neo4j(candidats, projets)
    finally:
        await close_mongo()
        await close_neo4j()
    print("[seed] OK")


if __name__ == "__main__":
    asyncio.run(main())