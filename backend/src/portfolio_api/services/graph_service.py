"""Service métier — Graphe (Neo4j, + MongoDB pour R7) : R4, R5, R6, R7.

Aucune requête Cypher ici : le service assemble les lignes renvoyées par les repositories
au format du contrat (API_ROUTES.md). Retourne None si la ressource n'existe pas (-> 404).

Repositories utilisés (repositories/neo4j_repo.py, repositories/mongo_projet_repo.py) :
- neo4j_repo.get_projet(slug) / get_competence(slug)
- neo4j_repo.get_similar_projets(slug, limit)
- neo4j_repo.get_candidat_graph(slug) : [] si le candidat n'existe pas ; sinon une ligne par
  (projet, compétence), avec projet_* = None si le candidat n'a aucun projet
- neo4j_repo.get_candidats_by_competence(slug) / get_projet_slugs_by_competence(slug)
- projet_repo.get_projets_by_slugs(slugs)
"""

from __future__ import annotations

from typing import Any, Optional

from portfolio_api.models import CompetenceCandidatsOut, CompetenceProjetsOut, GraphOut, SimilairesOut


class GraphService:
    def __init__(self, neo4j_repo: Any, projet_repo: Any):
        self.neo4j_repo = neo4j_repo
        self.projet_repo = projet_repo

    async def get_similar_projets(self, slug: str, *, limit: int = 5) -> Optional[SimilairesOut]:
        """R4 — projets du même candidat partageant le plus de compétences avec `slug` (None -> 404)."""
        if await self.neo4j_repo.get_projet(slug) is None:
            return None
        rows = await self.neo4j_repo.get_similar_projets(slug, limit=limit)
        similaires = [
            {
                "projet_slug": r["projet_slug"],
                "titre": r["titre"],
                "competences_communes": r["competences_communes"],
                "competences": r["competences"],
            }
            for r in rows
        ]
        return SimilairesOut(projet_slug=slug, similaires=similaires)

    async def get_candidat_graph(self, slug: str) -> Optional[GraphOut]:
        """R5 — graphe Candidat → Projets → Compétences, au format {nodes, links}."""
        rows = await self.neo4j_repo.get_candidat_graph(slug)
        if not rows:
            return None
        return GraphOut(**build_graph(rows))

    async def get_candidats_by_competence(self, slug: str) -> Optional[CompetenceCandidatsOut]:
        """R6 — candidats ayant réalisé au moins un projet utilisant la compétence."""
        competence = await self.neo4j_repo.get_competence(slug)
        if competence is None:
            return None
        candidats = await self.neo4j_repo.get_candidats_by_competence(slug)
        return CompetenceCandidatsOut(skill_slug=slug, nom=competence["nom"], candidats=candidats)

    async def get_projets_by_competence(self, slug: str) -> Optional[CompetenceProjetsOut]:
        """R7 — Neo4j donne la liste des projets, MongoDB leurs détails complets."""
        competence = await self.neo4j_repo.get_competence(slug)
        if competence is None:
            return None
        slugs = await self.neo4j_repo.get_projet_slugs_by_competence(slug)
        docs = {d["projet_slug"]: d for d in await self.projet_repo.get_projets_by_slugs(slugs)}
        # Ordre de Neo4j conservé ; un projet absent de MongoDB (bases désynchronisées) est ignoré
        projets = [docs[s] for s in slugs if s in docs]
        return CompetenceProjetsOut(skill_slug=slug, nom=competence["nom"], projets=projets)


def build_graph(rows: list[dict]) -> dict:
    """Construit {nodes, links} sans doublons à partir des lignes de get_candidat_graph.

    Les id sont préfixés par le type (contrat R5). Une ligne sans projet (candidat sans projet,
    OPTIONAL MATCH) ou sans compétence ne crée pas de nœud vide.
    """
    first = rows[0]
    cand_id = f"candidat:{first['candidat_slug']}"
    label = " ".join(p for p in (first.get("prenom"), first.get("nom")) if p) or first["candidat_slug"]
    nodes: dict[str, dict] = {
        cand_id: {"id": cand_id, "type": "candidat", "slug": first["candidat_slug"], "label": label}
    }
    links: list[dict] = []
    seen_links: set[tuple[str, str]] = set()

    def add_link(source: str, target: str, type_: str) -> None:
        if (source, target) not in seen_links:
            seen_links.add((source, target))
            links.append({"source": source, "target": target, "type": type_})

    for r in rows:
        if not r.get("projet_slug"):
            continue
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
