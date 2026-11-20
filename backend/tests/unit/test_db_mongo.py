"""Tests unitaires — Connexion MongoDB (client Motor créé à partir de la config, sans connexion réelle)."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest


@pytest.fixture(autouse=True)
def reset_mongo_singleton():
    """Réinitialise le singleton entre chaque test."""
    import portfolio_api.db.mongo as mongo_module

    old_client = mongo_module._client
    mongo_module._client = None
    yield
    mongo_module._client = old_client


def _settings(url="mongodb://localhost:27018", db="portfolio"):
    s = MagicMock()
    s.mongo_url = url
    s.mongo_db = db
    return s


def test_creates_client_with_url_and_returns_db():
    from portfolio_api.db import mongo

    mock_client = MagicMock()
    mock_db = MagicMock()
    mock_client.__getitem__ = MagicMock(return_value=mock_db)

    with (
        patch("portfolio_api.db.mongo.get_settings", return_value=_settings()),
        patch("portfolio_api.db.mongo.AsyncIOMotorClient", return_value=mock_client) as client_cls,
    ):
        db = mongo.get_mongo_db()

    assert db is mock_db
    client_cls.assert_called_once_with("mongodb://localhost:27018", serverSelectionTimeoutMS=5000)
    mock_client.__getitem__.assert_called_with("portfolio")


def test_returns_same_client_on_second_call():
    from portfolio_api.db import mongo

    with (
        patch("portfolio_api.db.mongo.get_settings", return_value=_settings()),
        patch("portfolio_api.db.mongo.AsyncIOMotorClient", return_value=MagicMock()) as client_cls,
    ):
        mongo.get_mongo_db()
        mongo.get_mongo_db()

    assert client_cls.call_count == 1


async def test_close_mongo_resets_singleton():
    from portfolio_api.db import mongo

    mock_client = MagicMock()
    mongo._client = mock_client
    await mongo.close_mongo()

    mock_client.close.assert_called_once()
    assert mongo._client is None
