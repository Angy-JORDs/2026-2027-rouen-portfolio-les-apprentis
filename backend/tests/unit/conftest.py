"""Fixtures et helpers pour les tests unitaires (mêmes fakes que SmartCity).

Mocks pour les accès aux bases (MongoDB/Motor, Neo4j) afin de tester chaque couche indépendamment.
"""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest


# ── Helpers MongoDB (Motor) ─────────────────────────────────────


class FakeCursor:
    """Simule un curseur Motor (async iterable avec chaînage).

    Usage :
        collection.find.return_value = FakeCursor([{"_id": "abc", ...}])
    """

    def __init__(self, docs: list[dict]):
        self._docs = list(docs)
        self._iter: list[dict] = []

    def sort(self, *args, **kwargs):
        return self

    def skip(self, n: int):
        return self

    def limit(self, n: int):
        return self

    def __aiter__(self):
        self._iter = list(self._docs)
        return self

    async def __anext__(self):
        if not self._iter:
            raise StopAsyncIteration
        return self._iter.pop(0)


class FakeAggregationCursor:
    """Simule un curseur d'agrégation Motor."""

    def __init__(self, docs: list[dict]):
        self._docs = docs

    async def to_list(self, length=None):
        return self._docs


class FakeDeleteResult:
    def __init__(self, deleted_count: int = 1):
        self.deleted_count = deleted_count


@pytest.fixture
def mongo_collection() -> MagicMock:
    """Mock d'une collection Motor."""
    collection = MagicMock()
    collection.count_documents = AsyncMock(return_value=0)
    collection.find_one = AsyncMock(return_value=None)
    collection.delete_one = AsyncMock(return_value=FakeDeleteResult(0))
    collection.find = MagicMock(return_value=FakeCursor([]))
    collection.aggregate = MagicMock(return_value=FakeAggregationCursor([]))
    return collection


@pytest.fixture
def mongo_db(mongo_collection) -> MagicMock:
    """Mock d'une AsyncIOMotorDatabase."""
    db = MagicMock()
    db.__getitem__ = MagicMock(return_value=mongo_collection)
    return db


# ── Helpers Neo4j ───────────────────────────────────────────────


class FakeNeo4jResult:
    """Simule le résultat d'une requête Neo4j (`data()` et `consume()`).

    Usage :
        session.run.return_value = FakeNeo4jResult([{"projet_slug": "...", ...}])
        session.run.return_value = FakeNeo4jResult(nodes_deleted=1)
    """

    def __init__(self, records: list[dict] | None = None, *, nodes_deleted: int = 0):
        self._records = records or []
        self._nodes_deleted = nodes_deleted

    async def data(self) -> list[dict]:
        return self._records

    async def consume(self):
        return SimpleNamespace(counters=SimpleNamespace(nodes_deleted=self._nodes_deleted))


@pytest.fixture
def neo4j_session() -> AsyncMock:
    """Mock d'une session Neo4j."""
    return AsyncMock()


@pytest.fixture
def neo4j_driver(neo4j_session) -> MagicMock:
    """Mock du driver Neo4j async.

    Simule le context manager ``async with driver.session() as session``.
    """
    driver = MagicMock()
    ctx = AsyncMock()
    ctx.__aenter__ = AsyncMock(return_value=neo4j_session)
    ctx.__aexit__ = AsyncMock(return_value=False)
    driver.session = MagicMock(return_value=ctx)
    return driver
