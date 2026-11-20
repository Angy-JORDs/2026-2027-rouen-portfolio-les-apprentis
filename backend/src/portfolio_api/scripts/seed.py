"""Peuple MongoDB et Neo4j avec les VRAIES données de tous les membres (dossier data/).

Exigences (évaluées au Jalon 2) :
- 1 seule commande : `just seed`
- idempotent : relancer le seed ne crée pas de doublons
- reproductible sur une machine neuve après `just up`

Le seed est générique : il charge tout ce qui se trouve dans data/candidats/*.json et
data/projets/*.json, sans rien coder en dur. Pour ajouter ou modifier une donnée, on édite
le JSON puis on relance `just seed` — aucune ligne de code à écrire.

Idempotence : chaque lancement vide puis recharge les collections MongoDB et les nœuds
Candidat / Projet / Competence de Neo4j. Les bases reflètent donc exactement le dossier data/
(une donnée retirée du JSON disparaît aussi des bases).
"""

from __future__ import annotations

import asyncio
import copy
import json
import sys
from pathlib import Path

from portfolio_api.db.mongo import close_mongo, get_mongo_db
from portfolio_api.db.neo4j import close_neo4j, get_neo4j_driver

DATA_DIR = Path(__file__).resolve().parents[4] / "data"


def load_member_files(kind: str) -> list[dict]:
    """Charge data/<kind>/*.json (hors fichiers commençant par '_', ex. _exemple.json)."""
    docs: list[dict] = []
    for path in sorted((DATA_DIR / kind).glob("*.json")):
        if path.name.startswith("_"):
            continue
        content = json.loads(path.read_text(encoding="utf-8"))
        docs.extend(content if isinstance(content, list) else [content])
    return docs


# --------------------------------------------------------------------------- contrôle des données

def check_data(candidats: list[dict], projets: list[dict]) -> list[str]:
    """Vérifie la cohérence de data/ avant d'écrire dans les bases.

    Lève SystemExit (aucune base modifiée) si une erreur bloquante est trouvée ;
    renvoie la liste des avertissements non bloquants.
    """
    erreurs: list[str] = []
    avertissements: list[str] = []

    vus: set[str] = set()
    for c in candidats:
        for champ in ("candidat_slug", "prenom", "nom"):
            if not c.get(champ):
                erreurs.append(f"candidat {c.get('candidat_slug', '?')} : champ « {champ} » manquant")
        slug = c.get("candidat_slug")
        if slug in vus:
            erreurs.append(f"candidat_slug en double : {slug}")
        vus.add(slug)

    declarees = {k["skill_slug"] for c in candidats for k in c.get("competences") or []}
    vus = set()
    for p in projets:
        slug = p.get("projet_slug", "?")
        for champ in ("projet_slug", "titre"):
            if not p.get(champ):
                erreurs.append(f"projet {slug} : champ « {champ} » manquant")
        if slug in vus:
            erreurs.append(f"projet_slug en double : {slug}")
        vus.add(slug)
        for auteur in p.get("candidat_slugs") or []:
            if auteur not in {c.get("candidat_slug") for c in candidats}:
                avertissements.append(f"projet {slug} : candidat « {auteur} » inconnu (relation ignorée dans Neo4j)")
        for skill in p.get("competences") or []:
            if skill not in declarees:
                avertissements.append(f"projet {slug} : compétence « {skill} » déclarée par aucun candidat")

    if erreurs:
        print("[seed] ERREURS dans data/ — aucune base n'a été modifiée :", file=sys.stderr)
        for e in erreurs:
            print(f"  - {e}", file=sys.stderr)
        raise SystemExit(1)
    return avertissements


# --------------------------------------------------------------------------- MongoDB

async def seed_mongo(candidats: list[dict], projets: list[dict]) -> None:
    """Vide puis recharge les collections (ARCHITECTURE.md §3) et crée les index (§3.3)."""
    db = get_mongo_db()

    # copies : insert_many ajoute un `_id` aux dicts qu'on lui passe
    await db.candidats.delete_many({})
    if candidats:
        await db.candidats.insert_many(copy.deepcopy(candidats))

    await db.projets.delete_many({})
    if projets:
        await db.projets.insert_many(copy.deepcopy(projets))

    # create_index est idempotent : relancer le seed ne duplique pas les index
    await db.candidats.create_index("candidat_slug", unique=True)  # R1
    await db.projets.create_index("projet_slug", unique=True)  # R8, R7
    await db.projets.create_index("candidat_slugs")  # R2, R3 (index multiclé sur le tableau)
    await db.projets.create_index("competences")  # R2 (filtre), galerie

    print(f"[seed] MongoDB : {len(candidats)} candidat(s), {len(projets)} projet(s), index créés")


# --------------------------------------------------------------------------- Neo4j

CONSTRAINTS = [
    "CREATE CONSTRAINT candidat_slug_unique IF NOT EXISTS FOR (c:Candidat) REQUIRE c.candidat_slug IS UNIQUE",
    "CREATE CONSTRAINT projet_slug_unique IF NOT EXISTS FOR (p:Projet) REQUIRE p.projet_slug IS UNIQUE",
    "CREATE CONSTRAINT skill_slug_unique IF NOT EXISTS FOR (s:Competence) REQUIRE s.skill_slug IS UNIQUE",
]


def build_competences(candidats: list[dict], projets: list[dict]) -> list[dict]:
    """Toutes les compétences : déclarées par les candidats (nom, domaine) + utilisées sans déclaration."""
    competences: dict[str, dict] = {}
    for c in candidats:
        for k in c.get("competences") or []:
            competences.setdefault(
                k["skill_slug"],
                {"skill_slug": k["skill_slug"], "nom": k.get("nom") or k["skill_slug"], "domaine": k.get("domaine")},
            )
    for p in projets:
        for skill in p.get("competences") or []:
            competences.setdefault(skill, {"skill_slug": skill, "nom": skill, "domaine": None})
    return list(competences.values())


async def seed_neo4j(candidats: list[dict], projets: list[dict]) -> None:
    """Contraintes (§4.3), puis graphe (Candidat)-[:REALISE]->(Projet)-[:UTILISE]->(Competence) (§4.1)."""
    competences = build_competences(candidats, projets)
    realise = [{"candidat": a, "projet": p["projet_slug"]} for p in projets for a in p.get("candidat_slugs") or []]
    utilise = [{"projet": p["projet_slug"], "skill": s} for p in projets for s in p.get("competences") or []]

    async with get_neo4j_driver().session() as session:
        for query in CONSTRAINTS:
            await session.run(query)

        # Vider uniquement les nœuds gérés par le seed
        await session.run("MATCH (n) WHERE n:Candidat OR n:Projet OR n:Competence DETACH DELETE n")

        # UNWIND : une requête par type au lieu d'une par élément
        await session.run(
            "UNWIND $rows AS row "
            "MERGE (c:Candidat {candidat_slug: row.candidat_slug}) "
            "SET c.prenom = row.prenom, c.nom = row.nom, c.titre = row.titre",
            rows=[{k: c.get(k) for k in ("candidat_slug", "prenom", "nom", "titre")} for c in candidats],
        )
        await session.run(
            "UNWIND $rows AS row "
            "MERGE (p:Projet {projet_slug: row.projet_slug}) "
            "SET p.titre = row.titre",
            rows=[{"projet_slug": p["projet_slug"], "titre": p["titre"]} for p in projets],
        )
        await session.run(
            "UNWIND $rows AS row "
            "MERGE (s:Competence {skill_slug: row.skill_slug}) "
            "SET s.nom = row.nom, s.domaine = row.domaine",
            rows=competences,
        )
        # MATCH (et non MERGE) sur les extrémités : un candidat inconnu ne crée pas de nœud fantôme
        await session.run(
            "UNWIND $rows AS row "
            "MATCH (c:Candidat {candidat_slug: row.candidat}), (p:Projet {projet_slug: row.projet}) "
            "MERGE (c)-[:REALISE]->(p)",
            rows=realise,
        )
        await session.run(
            "UNWIND $rows AS row "
            "MATCH (p:Projet {projet_slug: row.projet}), (s:Competence {skill_slug: row.skill}) "
            "MERGE (p)-[:UTILISE]->(s)",
            rows=utilise,
        )

    print(
        f"[seed] Neo4j : {len(candidats)} candidat(s), {len(projets)} projet(s), "
        f"{len(competences)} compétence(s), {len(realise)} REALISE, {len(utilise)} UTILISE"
    )


# --------------------------------------------------------------------------- point d'entrée

async def main() -> None:
    candidats = load_member_files("candidats")
    projets = load_member_files("projets")
    print(f"[seed] {len(candidats)} candidat(s), {len(projets)} projet(s) trouvés dans {DATA_DIR}")

    for avertissement in check_data(candidats, projets):
        print(f"[seed] attention : {avertissement}")

    try:
        await seed_mongo(candidats, projets)
        await seed_neo4j(candidats, projets)
    finally:
        await close_mongo()
        await close_neo4j()
    print("[seed] OK")


if __name__ == "__main__":
    asyncio.run(main())
