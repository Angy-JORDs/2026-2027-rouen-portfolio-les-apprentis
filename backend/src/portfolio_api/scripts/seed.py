"""Peuple MongoDB et Neo4j avec les VRAIES données de tous les membres (dossier data/).

Exigences (évaluées au Jalon 2) :
- 1 seule commande : `just seed`
- idempotent : relancer le seed ne crée pas de doublons
- reproductible sur une machine neuve après `just up`

Le seed est générique : il charge tout ce qui se trouve dans data/candidats/*.json et
data/projets/*.json, sans rien coder en dur. Pour ajouter ou modifier une donnée, on édite
le JSON puis on relance `just seed` — aucune ligne de code à écrire.

Étapes :
1. prepare()   : normalise les slugs pivots (" MongoDB " -> "mongodb") et valide les données ;
                 en cas d'erreur, aucune base n'est modifiée.
2. seed_mongo  : vide puis recharge les collections, crée les index (ARCHITECTURE.md §3).
3. seed_neo4j  : contraintes, puis graphe Candidat -[:REALISE]-> Projet -[:UTILISE]-> Competence (§4).

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
from typing import Any

from portfolio_api.core.slugs import normalize_slug
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


# --------------------------------------------------------------------------- normalisation + validation

def _as_list(value: Any) -> list:
    """None -> [] ; "x" -> ["x"] ; liste -> liste."""
    if value is None:
        return []
    return value if isinstance(value, list) else [value]


def _slug_list(values: Any) -> list[str]:
    """Normalise une liste de slugs : minuscules, sans espaces, sans vides ni doublons (ordre conservé)."""
    slugs: list[str] = []
    for value in _as_list(values):
        slug = normalize_slug(value)
        if slug and slug not in slugs:
            slugs.append(slug)
    return slugs


def prepare(candidats: list[dict], projets: list[dict]) -> tuple[list[dict], list[dict], list[str]]:
    """Normalise et valide les données de data/ avant toute écriture en base.

    - slugs pivots en minuscules, sans espaces (candidat_slug, projet_slug, skill_slug,
      candidat_slugs, compétences des projets et des expériences), sans doublons ;
    - ancien format accepté : `candidat_slug` (un seul auteur) devient `candidat_slugs` ;
    - lève ValueError (toutes les erreurs listées) si un slug manque, si un champ obligatoire
      manque ou si un slug est en double ;
    - renvoie (candidats, projets, avertissements) : un auteur inconnu donne un avertissement
      (la relation REALISE correspondante est ignorée dans Neo4j).

    Les listes reçues ne sont pas modifiées (copies).
    """
    erreurs: list[str] = []
    avertissements: list[str] = []

    cands: list[dict] = []
    vus: set[str] = set()
    for i, brut in enumerate(candidats):
        c = copy.deepcopy(brut)
        slug = normalize_slug(c.get("candidat_slug"))
        nom_affiche = f"{c.get('prenom', '?')} {c.get('nom', '?')}"
        if not slug:
            erreurs.append(f"candidat n°{i + 1} ({nom_affiche}) : candidat_slug manquant")
            continue
        c["candidat_slug"] = slug
        for champ in ("prenom", "nom"):
            if not c.get(champ):
                erreurs.append(f"candidat {slug} : champ « {champ} » manquant")
        if slug in vus:
            erreurs.append(f"candidat_slug en double : {slug}")
        vus.add(slug)

        competences: list[dict] = []
        declarees: set[str] = set()
        for k in _as_list(c.get("competences")):
            skill = normalize_slug(k.get("skill_slug")) if isinstance(k, dict) else None
            if not skill:
                erreurs.append(f"candidat {slug} : compétence sans skill_slug ({k!r})")
                continue
            if skill not in declarees:  # une compétence déclarée deux fois : on garde la première
                declarees.add(skill)
                competences.append({**k, "skill_slug": skill})
        c["competences"] = competences
        for exp in _as_list(c.get("experiences")):
            if isinstance(exp, dict):
                exp["competences"] = _slug_list(exp.get("competences"))
        cands.append(c)

    slugs_candidats = {c["candidat_slug"] for c in cands}
    projs: list[dict] = []
    vus = set()
    for i, brut in enumerate(projets):
        p = copy.deepcopy(brut)
        slug = normalize_slug(p.get("projet_slug"))
        if not slug:
            erreurs.append(f"projet n°{i + 1} ({p.get('titre', '?')}) : projet_slug manquant")
            continue
        p["projet_slug"] = slug
        if not p.get("titre"):
            erreurs.append(f"projet {slug} : champ « titre » manquant")
        if slug in vus:
            erreurs.append(f"projet_slug en double : {slug}")
        vus.add(slug)

        # Ancien format : un seul auteur dans `candidat_slug` -> liste `candidat_slugs`
        auteurs = _as_list(p.get("candidat_slugs")) + _as_list(p.pop("candidat_slug", None))
        p["candidat_slugs"] = _slug_list(auteurs)
        p["competences"] = _slug_list(p.get("competences"))
        for auteur in p["candidat_slugs"]:
            if auteur not in slugs_candidats:
                avertissements.append(f"projet {slug} : candidat « {auteur} » inconnu (relation ignorée dans Neo4j)")
        projs.append(p)

    if erreurs:
        raise ValueError("\n".join(erreurs))
    return cands, projs, avertissements


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


def build_competence_rows(candidats: list[dict], projets: list[dict]) -> list[dict]:
    """Nœuds Competence : déclarées par les candidats (nom, domaine) + utilisées sans déclaration.

    À appeler sur des données passées par prepare() (slugs déjà normalisés).
    """
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
    competences = build_competence_rows(candidats, projets)
    realise = [{"candidat": a, "projet": p["projet_slug"]} for p in projets for a in p["candidat_slugs"]]
    utilise = [{"projet": p["projet_slug"], "skill": s} for p in projets for s in p["competences"]]

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
    bruts_candidats = load_member_files("candidats")
    bruts_projets = load_member_files("projets")
    print(f"[seed] {len(bruts_candidats)} candidat(s), {len(bruts_projets)} projet(s) trouvés dans {DATA_DIR}")

    try:
        candidats, projets, avertissements = prepare(bruts_candidats, bruts_projets)
    except ValueError as exc:
        print("[seed] ERREURS dans data/ — aucune base n'a été modifiée :", file=sys.stderr)
        for ligne in str(exc).splitlines():
            print(f"  - {ligne}", file=sys.stderr)
        raise SystemExit(1) from None
    for avertissement in avertissements:
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
