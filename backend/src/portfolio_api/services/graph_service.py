"""Service métier — Graphe (Neo4j, + MongoDB pour R7) : R4, R5, R6, R7.

Aucune requête Cypher ici : le service assemble les lignes renvoyées par les repositories
au format du contrat (API_ROUTES.md). Retourne None si la ressource n'existe pas (-> 404).

Méthodes attendues des repositories :
- neo4j_repo.get_projet(slug) -> dict | None                  ({"projet_slug", "titre"})
- neo4j_repo.similar_projets(slug, limit) -> list[dict]        ({"projet_slug", "titre", "competences"}),
      triés par nombre de compétences communes décroissant
- neo4j_repo.get_candidat(slug) -> dict | None                 ({"candidat_slug", "prenom", "nom"})
- neo4j_repo.candidat_graph(slug) -> list[dict]                une ligne par (projet, compétence) :
      {"projet_slug", "projet_titre", "skill_slug", "skill_nom"} ; skill_* = None si projet sans compétence
- neo4j_repo.get_competence(slug) -> dict | None               ({"skill_slug", "nom"})
- neo4j_repo.candidats_by_competence(slug) -> list[dict]       ({"candidat_slug", "prenom", "nom", "nb_projets"}),
      triés par nb_projets décroissant
- neo4j_repo.projets_by_competence(slug) -> list[str]          projet_slugs, dans l'ordre d'affichage
- projet_repo.find_by_slugs(slugs) -> list[dict]               projets complets (MongoDB)
"""

from __future__ import annotations

from typing import Any, Optional

from portfolio_api.models import CompetenceCandidatsOut, CompetenceProjetsOut, GraphOut, SimilairesOut


class GraphService:
    def __init__(self, neo4j_repo: Any, projet_repo: Any):
        self.neo4j_repo = neo4j_repo
        self.projet_repo = projet_repo

    async def get_similar_projets(self, slug: str, *, limit: int = 5) -> Optional[SimilairesOut]:
        """R4 — projets partageant le plus de compétences avec `slug`."""
        if await self.neo4j_repo.get_projet(slug) is None:
            return None
        rows = await self.neo4j_repo.similar_projets(slug, limit=limit)
        similaires = [
            {
                "projet_slug": r["projet_slug"],
                "titre": r["titre"],
                "competences_communes": len(r["competences"]),
                "competences": r["competences"],
            }
            for r in rows
        ]
        return SimilairesOut(projet_slug=slug, similaires=similaires)

    async def get_candidat_graph(self, slug: str) -> Optional[GraphOut]:
        """R5 — graphe Candidat → Projets → Compétences, au format {nodes, links}."""
        candidat = await self.neo4j_repo.get_candidat(slug)
        if candidat is None:
            return None
        rows = await self.neo4j_repo.candidat_graph(slug)
        return GraphOut(**build_graph(candidat, rows))

    async def get_candidats_by_competence(self, slug: str) -> Optional[CompetenceCandidatsOut]:
        """R6 — candidats ayant réalisé au moins un projet utilisant la compétence."""
        competence = await self.neo4j_repo.get_competence(slug)
        if competence is None:
            return None
        candidats = await self.neo4j_repo.candidats_by_competence(slug)
        return CompetenceCandidatsOut(skill_slug=slug, nom=competence["nom"], candidats=candidats)

    async def get_projets_by_competence(self, slug: str) -> Optional[CompetenceProjetsOut]:
        """R7 — Neo4j donne la liste des projets, MongoDB leurs détails complets."""
        competence = await self.neo4j_repo.get_competence(slug)
        if competence is None:
            return None
        slugs = await self.neo4j_repo.projets_by_competence(slug)
        docs = {d["projet_slug"]: d for d in await self.projet_repo.find_by_slugs(slugs)}
        # Ordre de Neo4j conservé ; un projet absent de MongoDB (bases désynchronisées) est ignoré
        projets = [docs[s] for s in slugs if s in docs]
        return CompetenceProjetsOut(skill_slug=slug, nom=competence["nom"], projets=projets)


def build_graph(candidat: dict, rows: list[dict]) -> dict:
    """Construit {nodes, links} sans doublons ; les id sont préfixés par le type (contrat R5)."""
    cand_id = f"candidat:{candidat['candidat_slug']}"
    label = " ".join(p for p in (candidat.get("prenom"), candidat.get("nom")) if p)
    nodes: dict[str, dict] = {
        cand_id: {"id": cand_id, "type": "candidat", "slug": candidat["candidat_slug"], "label": label}
    }
    links: list[dict] = []
    seen_links: set[tuple[str, str]] = set()

    def add_link(source: str, target: str, type_: str) -> None:
        if (source, target) not in seen_links:
            seen_links.add((source, target))
            links.append({"source": source, "target": target, "type": type_})

    for r in rows:
        projet_id = f"projet:{r['projet_slug']}"
        nodes.setdefault(
            projet_id,
            {"id": projet_id, "type": "projet", "slug": r["projet_slug"], "label": r.get("projet_titre") or r["projet_slug"]},
        )
        add_link(cand_id, projet_id, "REALISE")

        if r.get("skill_slug"):
            skill_id = f"competence:{r['skill_slug']}"
            nodes.setdefault(
                skill_id,
                {"id": skill_id, "type": "competence", "slug": r["skill_slug"], "label": r.get("skill_nom") or r["skill_slug"]},
            )
            add_link(projet_id, skill_id, "UTILISE")

    return {"nodes": list(nodes.values()), "links": links}
