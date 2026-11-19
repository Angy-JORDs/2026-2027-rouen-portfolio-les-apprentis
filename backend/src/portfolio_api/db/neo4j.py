"""Connexion Neo4j (singleton AsyncDriver) — même schéma que SmartCity."""
 
from __future__ import annotations
 
from neo4j import AsyncDriver, AsyncGraphDatabase
 
from portfolio_api.core.config import get_settings
 
_driver: AsyncDriver | None = None
 
 
def get_neo4j_driver() -> AsyncDriver:
    """Retourne le driver Neo4j asynchrone (singleton, connexion paresseuse)."""
    global _driver
    if _driver is None:
        settings = get_settings()
        _driver = AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_user, settings.neo4j_password),
            connection_timeout=5,  # base arrêtée : échouer vite (503) plutôt qu'attendre 30 s
        )
    return _driver
 
 
async def close_neo4j() -> None:
    """Ferme le driver (appelé à l'arrêt de l'API)."""
    global _driver
    if _driver is not None:
        await _driver.close()
        _driver = None