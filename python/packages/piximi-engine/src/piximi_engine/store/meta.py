"""Project metadata in SQLite.

Every entity is stored as its wire JSON under its kind and id, with an
optional parent id for the lookups the queries need (planes of an image,
channels of a plane, annotations of an image). Rows keep insertion order, so
listings are stable. Revisions arrive with the editing phase.
"""

from __future__ import annotations

import json
import sqlite3
from collections.abc import Iterable
from pathlib import Path
from typing import TypeVar

from piximi_schema.base import WireModel

M = TypeVar("M", bound=WireModel)

_SCHEMA = """
CREATE TABLE IF NOT EXISTS entities (
  kind   TEXT NOT NULL,
  id     TEXT NOT NULL,
  parent TEXT,
  data   TEXT NOT NULL,
  PRIMARY KEY (kind, id)
);
CREATE INDEX IF NOT EXISTS entities_parent ON entities (kind, parent);
CREATE TABLE IF NOT EXISTS sources (
  path TEXT PRIMARY KEY,
  image_ids TEXT NOT NULL
);
"""


class MetaStore:
    def __init__(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        self._db = sqlite3.connect(path)
        self._db.execute("PRAGMA journal_mode=WAL")
        self._db.executescript(_SCHEMA)

    def close(self) -> None:
        self._db.close()

    # ── Entities ─────────────────────────────────────────────────────────────

    def put(self, kind: str, model: WireModel, parent: str | None = None) -> None:
        self.put_many(kind, [(model, parent)])

    def put_many(self, kind: str, items: Iterable[tuple[WireModel, str | None]]) -> None:
        with self._db:
            self._db.executemany(
                "INSERT OR REPLACE INTO entities (kind, id, parent, data) VALUES (?, ?, ?, ?)",
                [
                    (kind, getattr(model, "id"), parent, json.dumps(model.to_wire()))
                    for model, parent in items
                ],
            )

    def get(self, kind: str, id: str, model: type[M]) -> M | None:
        row = self._db.execute(
            "SELECT data FROM entities WHERE kind = ? AND id = ?", (kind, id)
        ).fetchone()
        return None if row is None else model.model_validate(json.loads(row[0]))

    def list(
        self,
        kind: str,
        model: type[M],
        *,
        parent: str | None = None,
        parents: Iterable[str] | None = None,
    ) -> list[M]:
        if parents is not None:
            parent_list = list(parents)
            if not parent_list:
                return []
            placeholders = ",".join("?" * len(parent_list))
            rows = self._db.execute(
                f"SELECT data FROM entities WHERE kind = ? AND parent IN ({placeholders}) ORDER BY rowid",
                (kind, *parent_list),
            )
        elif parent is not None:
            rows = self._db.execute(
                "SELECT data FROM entities WHERE kind = ? AND parent = ? ORDER BY rowid",
                (kind, parent),
            )
        else:
            rows = self._db.execute(
                "SELECT data FROM entities WHERE kind = ? ORDER BY rowid", (kind,)
            )
        return [model.model_validate(json.loads(row[0])) for row in rows]

    def ids(self, kind: str, *, parents: Iterable[str] | None = None) -> list[str]:
        if parents is not None:
            parent_list = list(parents)
            if not parent_list:
                return []
            placeholders = ",".join("?" * len(parent_list))
            rows = self._db.execute(
                f"SELECT id FROM entities WHERE kind = ? AND parent IN ({placeholders}) ORDER BY rowid",
                (kind, *parent_list),
            )
        else:
            rows = self._db.execute(
                "SELECT id FROM entities WHERE kind = ? ORDER BY rowid", (kind,)
            )
        return [row[0] for row in rows]

    def count(self, kind: str) -> int:
        return self._db.execute("SELECT COUNT(*) FROM entities WHERE kind = ?", (kind,)).fetchone()[0]

    def delete(self, kind: str, ids: Iterable[str]) -> None:
        with self._db:
            self._db.executemany(
                "DELETE FROM entities WHERE kind = ? AND id = ?", [(kind, id) for id in ids]
            )

    # ── Sources ──────────────────────────────────────────────────────────────

    def source_image_ids(self, path: str) -> list[str] | None:
        row = self._db.execute("SELECT image_ids FROM sources WHERE path = ?", (path,)).fetchone()
        return None if row is None else json.loads(row[0])

    def record_source(self, path: str, image_ids: list[str]) -> None:
        with self._db:
            self._db.execute(
                "INSERT OR REPLACE INTO sources (path, image_ids) VALUES (?, ?)",
                (path, json.dumps(image_ids)),
            )
