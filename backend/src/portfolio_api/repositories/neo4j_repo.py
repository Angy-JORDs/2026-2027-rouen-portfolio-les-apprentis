"""Repository Neo4j — graphe (Candidat)-[:REALISE]->(Projet)-[:UTILISE]->(Competence).
 
Même schéma que SmartCity : `async with self.driver.session() as session`, puis `session.run(...)`
et `result.data()`. Renvoie des dict.
"""
 
from __future__ import annotations
 
from typing import Optional
 
from neo4j import AsyncDriver
 
 
class Neo4jRepository:
    def __init__(self, driver: AsyncDriver):
        self.driver = driver
 
    async def _run(self, query: str, **params) -> list[dict]:
        async with self.driver.session() as session:
            result = await session.run(query, **params)
            return await result.data()
 
    async def get_projet(self, slug: str) -> Optional[dict]:
        """Nœud Projet (projet_slug, titre) ou None."""
        query = """
        MATCH (p:Projet {projet_slug: $slug})
        RETURN p.projet_slug AS projet_slug, p.titre AS titre
        """
        records = await self._run(query, slug=slug)
        return records[0] if records else None
 
    async def get_competence(self, slug: str) -> Optional[dict]:
        """Nœud Competence (skill_slug, nom) ou None."""
        query = """
        MATCH (s:Competence {skill_slug: $slug})
        RETURN s.skill_slug AS skill_slug, s.nom AS nom
        """
        records = await self._run(query, slug=slug)
        return records[0] if records else None
 
    async def get_similar_projets(self, slug: str, limit: int = 5) -> list[dict]:
        """R4 — autres projets du MÊME candidat partageant des compétences avec `slug`,
        par nombre de compétences communes (chaque portfolio ne montre que ses propres projets)."""
        query = """
        MATCH (c:Candidat)-[:REALISE]->(p:Projet {projet_slug: $slug})
        MATCH (c)-[:REALISE]->(autre:Projet)
        WHERE autre.projet_slug <> $slug
        MATCH (p)-[:UTILISE]->(s:Competence)<-[:UTILISE]-(autre)
        WITH autre, collect(DISTINCT s.skill_slug) AS competences
        RETURN autre.projet_slug AS projet_slug,
               autre.titre AS titre,
               size(competences) AS competences_communes,
               competences
        ORDER BY competences_communes DESC, titre ASC
        LIMIT $limit
        """
        return await self._run(query, slug=slug, limit=limit)
 
    async def get_candidat_graph(self, slug: str) -> list[dict]:
        """R5 — lignes (candidat, projet, compétence) du sous-graphe d'un candidat ([] si inconnu)."""
        query = """
        MATCH (c:Candidat {candidat_slug: $slug})
        OPTIONAL MATCH (c)-[:REALISE]->(p:Projet)
        OPTIONAL MATCH (p)-[:UTILISE]->(s:Competence)
        RETURN c.candidat_slug AS candidat_slug, c.prenom AS prenom, c.nom AS nom,
               p.projet_slug AS projet_slug, p.titre AS projet_titre,
               s.skill_slug AS skill_slug, s.nom AS skill_nom
        """
        return await self._run(query, slug=slug)
 
    async def get_candidats_by_competence(self, slug: str) -> list[dict]:
        """R6 — candidats ayant réalisé au moins un projet utilisant la compétence."""
        query = """
        MATCH (c:Candidat)-[:REALISE]->(p:Projet)-[:UTILISE]->(:Competence {skill_slug: $slug})
        RETURN c.candidat_slug AS candidat_slug, c.prenom AS prenom, c.nom AS nom,
               count(DISTINCT p) AS nb_projets
        ORDER BY nb_projets DESC, nom ASC, prenom ASC
        """
        return await self._run(query, slug=slug)
 
    async def get_projet_slugs_by_competence(self, slug: str) -> list[str]:
        """R7 — slugs des projets utilisant la compétence (les détails viennent de MongoDB)."""
        query = """
        MATCH (p:Projet)-[:UTILISE]->(:Competence {skill_slug: $slug})
        RETURN p.projet_slug AS projet_slug
        ORDER BY p.titre ASC
        """
        records = await self._run(query, slug=slug)
        return [record["projet_slug"] for record in records]
 
    async def delete_projet(self, slug: str) -> bool:
        """Supprime le nœud Projet et ses relations. True si un nœud a été supprimé."""
        async with self.driver.session() as session:
            result = await session.run(
                "MATCH (p:Projet {projet_slug: $slug}) DETACH DELETE p", slug=slug
            )
            summary = await result.consume()
            return summary.counters.nodes_deleted > 0