"""Repository MongoDB — collection `projets` (pattern Referencing : `candidat_slugs` référence les
auteurs). Renvoie des dict, sans `_id`.
"""
 
from __future__ import annotations
 
from typing import Optional
 
from motor.motor_asyncio import AsyncIOMotorDatabase
 
 
class MongoProjetRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db["projets"]
 
    @staticmethod
    def _build_query(candidat_slug: Optional[str], competence: Optional[str]) -> dict:
        query: dict = {}
        if candidat_slug:
            query["candidat_slugs"] = candidat_slug  # vrai si le slug est dans le tableau des auteurs
        if competence:
            query["competences"] = competence
        return query
 
    async def get_projets(
        self,
        *,
        candidat_slug: Optional[str] = None,
        competence: Optional[str] = None,
        page: int = 1,
        size: int = 20,
    ) -> tuple[list[dict], int]:
        """Projets filtrés (par auteur et/ou compétence), triés par titre, paginés + total (R2)."""
        query = self._build_query(candidat_slug, competence)
        total_count = await self.collection.count_documents(query)
 
        offset = (page - 1) * size
        cursor = self.collection.find(query).sort("titre", 1).skip(offset).limit(size)
        projets = [doc async for doc in cursor]
 
        for projet in projets:
            projet.pop("_id", None)
 
        return projets, total_count
 
    async def get_projet_by_slug(self, slug: str) -> Optional[dict]:
        """R8 — document complet d'un projet, ou None."""
        doc = await self.collection.find_one({"projet_slug": slug})
        if doc:
            doc.pop("_id", None)
        return doc
 
    async def get_projets_by_slugs(self, slugs: list[str]) -> list[dict]:
        """Documents complets pour une liste de slugs (enrichit les résultats Neo4j, R7)."""
        if not slugs:
            return []
        cursor = self.collection.find({"projet_slug": {"$in": slugs}})
        projets = [doc async for doc in cursor]
        for projet in projets:
            projet.pop("_id", None)
        return projets
 
    async def count_projets_candidat(self, candidat_slug: str) -> int:
        return await self.collection.count_documents({"candidat_slugs": candidat_slug})
 
    async def get_competence_stats(self, candidat_slug: str) -> list[dict]:
        """R3 — nombre de projets par compétence pour un candidat (pipeline d'agrégation)."""
        pipeline = [
            {"$match": {"candidat_slugs": candidat_slug}},
            {"$unwind": "$competences"},
            {"$group": {"_id": "$competences", "nombre_projets": {"$sum": 1}}},
            {"$sort": {"nombre_projets": -1, "_id": 1}},
            {"$project": {"_id": 0, "skill_slug": "$_id", "nombre_projets": 1}},
        ]
        cursor = self.collection.aggregate(pipeline)
        return await cursor.to_list(length=None)
 
    async def delete_projet(self, slug: str) -> bool:
        """Supprime le projet. True si un document a été supprimé."""
        result = await self.collection.delete_one({"projet_slug": slug})
        return result.deleted_count > 0