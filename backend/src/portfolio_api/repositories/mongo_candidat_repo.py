"""Repository MongoDB — collection `candidats` (pattern Embedding : expériences, formations et
compétences imbriquées dans le document). Renvoie des dict, sans `_id`.
"""
 
from __future__ import annotations
 
from typing import Optional
 
from motor.motor_asyncio import AsyncIOMotorDatabase
 
 
class MongoCandidatRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db["candidats"]
 
    async def get_candidats(self, *, page: int = 1, size: int = 20) -> tuple[list[dict], int]:
        """Liste paginée des candidats (triés par nom, prénom) + total."""
        total_count = await self.collection.count_documents({})
 
        offset = (page - 1) * size
        cursor = (
            self.collection.find({}).sort([("nom", 1), ("prenom", 1)]).skip(offset).limit(size)
        )
        candidats = [doc async for doc in cursor]
 
        # Suppression de l'identifiant technique MongoDB
        for candidat in candidats:
            candidat.pop("_id", None)
 
        return candidats, total_count
 
    async def get_candidat_by_slug(self, slug: str) -> Optional[dict]:
        """Profil complet d'un candidat (R1), ou None s'il n'existe pas."""
        doc = await self.collection.find_one({"candidat_slug": slug})
        if doc:
            doc.pop("_id", None)
        return doc