"""Tests unitaires — Connexion Neo4j (driver créé à partir de la config, sans connexion réelle)."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest


@pytest.fixture(autouse=True)
def reset_neo4j_singleton():
    import portfolio_api.db.neo4j as neo4j_module

    old_driver = neo4j_module._driver
    neo4j_module._driver = None
    yield
    neo4j_module._driver = old_driver


def _settings():
    s = MagicMock()
    s.neo4j_uri = "bolt://localhost:7688"
    s.neo4j_user = "neo4j"
    s.neo4j_password = "password"
    return s


def test_creates_driver_with_uri_and_auth():
    from portfolio_api.db import neo4j

    with (
        patch("portfolio_api.db.neo4j.get_settings", return_value=_settings()),
        patch("portfolio_api.db.neo4j.AsyncGraphDatabase") as gdb,
    ):
        driver = neo4j.get_neo4j_driver()

    assert driver is gdb.driver.return_value
    args, kwargs = gdb.driver.call_args
    assert args == ("bolt://localhost:7688",)
    assert kwargs["auth"] == ("neo4j", "password")


def test_returns_same_driver_on_second_call():
    from portfolio_api.db import neo4j

    with (
        patch("portfolio_api.db.neo4j.get_settings", return_value=_settings()),
        patch("portfolio_api.db.neo4j.AsyncGraphDatabase") as gdb,
    ):
        assert neo4j.get_neo4j_driver() is neo4j.get_neo4j_driver()

    assert gdb.driver.call_count == 1


async def test_close_neo4j_resets_singleton():
    from portfolio_api.db import neo4j

    driver = MagicMock()
    driver.close = AsyncMock()
    neo4j._driver = driver
    await neo4j.close_neo4j()

    driver.close.assert_awaited_once()
    assert neo4j._driver is None
