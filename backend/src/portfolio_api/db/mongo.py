"""Connexion MongoDB via Motor (async) — même singleton que SmartCity."""

from __future__ import annotations

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from portfolio_api.core.config import get_settings

_client: AsyncIOMotorClient | None = None


def get_mongo_db() -> AsyncIOMotorDatabase:
    """Retourne la base MongoDB du portfolio (singleton, connexion paresseuse)."""
    global _client
    settings = get_settings()
    if _client is None:
        # serverSelectionTimeoutMS : base injoignable -> erreur (503) en 5 s au lieu de 30 s
        _client = AsyncIOMotorClient(settings.mongo_url, serverSelectionTimeoutMS=5000)
    return _client[settings.mongo_db]


async def close_mongo() -> None:
    """Ferme la connexion (appelé à l'arrêt de l'API)."""
    global _client
    if _client is not None:
        _client.close()
        _client = None
