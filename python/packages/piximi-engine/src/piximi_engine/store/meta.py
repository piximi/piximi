"""Project metadata in SQLite.

Every entity is stored as its wire JSON under its kind and id, next to the
handful of fields queries filter and sort on, copied into indexed columns
when the row is written (see ``_INDEXED``). Annotation masks sit in their own
column so listing annotations never parses them. Rows keep their rowid across
updates, so insertion order is stable. Revisions arrive with the editing
phase.
"""

from __future__ import annotations

import json
import sqlite3
from collections.abc import Iterable, Iterator, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any, TypeVar

from piximi_schema.base import WireModel

M = TypeVar("M", bound=WireModel)

SCHEMA_VERSION = 3
"""Bumped whenever the layout changes; older stores are refused, not migrated.
3 adds the ``margin`` column behind the softmax sort."""

_INDEXED: dict[str, str] = {
    # wire field -> column
    "name": "name",
    "seriesId": "series_id",
    "imageId": "image_id",
    "planeId": "plane_id",
    "volumeId": "volume_id",
    "kindId": "kind_id",
    "categoryId": "category_id",
    "partition": "partition",
    "predictionConfidence": "confidence",
    "zIndex": "z_index",
}
_EXTRA = ("margin",)
"""Indexed columns no wire field carries; written through ``index``: the gap
between the top two class probabilities of a pending prediction."""
_COLUMNS = ("parent", "data", "mask", *_INDEXED.values(), *_EXTRA)

_SCHEMA = f"""
CREATE TABLE IF NOT EXISTS entities (
  kind        TEXT NOT NULL,
  id          TEXT NOT NULL,
  parent      TEXT,
  data        TEXT NOT NULL,
  mask        TEXT,
  name        TEXT,
  series_id   TEXT,
  image_id    TEXT,
  plane_id    TEXT,
  volume_id   TEXT,
  kind_id     TEXT,
  category_id TEXT,
  partition   TEXT,
  confidence  REAL,
  z_index     INTEGER,
  margin      REAL,
  PRIMARY KEY (kind, id)
);
CREATE INDEX IF NOT EXISTS entities_parent ON entities (kind, parent);
CREATE INDEX IF NOT EXISTS entities_name ON entities (kind, name);
CREATE INDEX IF NOT EXISTS entities_series ON entities (kind, series_id);
CREATE INDEX IF NOT EXISTS entities_image ON entities (kind, image_id);
CREATE INDEX IF NOT EXISTS entities_plane ON entities (kind, plane_id);
CREATE INDEX IF NOT EXISTS entities_volume ON entities (kind, volume_id);
CREATE INDEX IF NOT EXISTS entities_kind_id ON entities (kind, kind_id);
CREATE INDEX IF NOT EXISTS entities_category ON entities (kind, category_id);
CREATE INDEX IF NOT EXISTS entities_partition ON entities (kind, partition);
CREATE INDEX IF NOT EXISTS entities_margin ON entities (kind, margin);
CREATE TABLE IF NOT EXISTS sources (
  path TEXT PRIMARY KEY,
  image_ids TEXT NOT NULL
);
PRAGMA user_version = {SCHEMA_VERSION};
"""

_UPSERT = (
    f"INSERT INTO entities (kind, id, {', '.join(_COLUMNS)}) "
    f"VALUES ({', '.join('?' * (len(_COLUMNS) + 2))}) "
    "ON CONFLICT (kind, id) DO UPDATE SET "
    + ", ".join(f"{column} = excluded.{column}" for column in _COLUMNS)
)

_UPDATE = (
    "UPDATE entities SET data = ?, "
    + ", ".join(f"{column} = ?" for column in (*_INDEXED.values(), *_EXTRA))
    + " WHERE kind = ? AND id = ?"
)

_IN_CHUNK = 900
"""Values per ``IN (...)``, under SQLite's default variable limit."""


class IncompatibleStoreError(RuntimeError):
    """The store on disk was written by an engine with another layout."""


@dataclass(frozen=True)
class Clause:
    """A ``WHERE`` fragment over the ``e`` alias and its parameters."""

    sql: str
    params: tuple[Any, ...] = ()


def annotation_index(volume: Any) -> dict[str, Any]:
    """The indexed columns an annotation inherits from its ``AnnotationVolume``
    (kind, category and prediction confidence live on the volume); pass the
    result as ``index`` when writing the annotation."""
    return {
        "kind_id": volume.kind_id,
        "category_id": volume.category_id,
        "confidence": volume.prediction_confidence,
    }


def random_key(seed: int, id: str) -> int:
    """A deterministic 32-bit key for ``id`` under ``seed`` (FNV-1a over
    ``"{seed}:{id}"``): random order is a sort on it. The frontend computes
    the same key, so both backends shuffle alike."""
    key = 0x811C9DC5
    for byte in f"{seed}:{id}".encode():
        key = ((key ^ byte) * 0x01000193) & 0xFFFFFFFF
    return key


def _chunks(values: Sequence[Any]) -> Iterator[Sequence[Any]]:
    for start in range(0, len(values), _IN_CHUNK):
        yield values[start : start + _IN_CHUNK]


class MetaStore:
    def __init__(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        self._db = sqlite3.connect(path)
        self._db.execute("PRAGMA journal_mode=WAL")
        self._check_version(path)
        self._db.executescript(_SCHEMA)
        self._db.create_function("piximi_rand", 2, random_key, deterministic=True)

    def _check_version(self, path: Path) -> None:
        has_tables = (
            self._db.execute("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'entities'").fetchone()
            is not None
        )
        version = self._db.execute("PRAGMA user_version").fetchone()[0]
        if has_tables and version != SCHEMA_VERSION:
            self._db.close()
            raise IncompatibleStoreError(
                f"{path} was written by an older engine (layout {version}, this engine uses "
                f"{SCHEMA_VERSION}); delete its data directory and import the images again"
            )

    def close(self) -> None:
        self._db.close()

    # ── Entities ─────────────────────────────────────────────────────────────

    def put(
        self,
        kind: str,
        model: WireModel,
        parent: str | None = None,
        *,
        index: dict[str, Any] | None = None,
    ) -> None:
        self.put_many(kind, [(model, parent)], index=None if index is None else {model.id: index})  # type: ignore[attr-defined]

    def put_many(
        self,
        kind: str,
        items: Iterable[tuple[WireModel, str | None]],
        *,
        index: dict[str, dict[str, Any]] | None = None,
    ) -> None:
        """Writes or replaces rows. ``index`` adds indexed columns a model
        does not carry itself, by id (an annotation's ``kind_id`` and
        ``category_id`` live on its volume)."""
        rows = []
        for model, parent in items:
            wire = model.to_wire()
            id = wire["id"]
            mask = wire.pop("encodedMask", None)
            columns: dict[str, Any] = {column: wire.get(field) for field, column in _INDEXED.items()}
            columns.update({column: None for column in _EXTRA})
            if index and id in index:
                columns.update(index[id])
            rows.append(
                (
                    kind,
                    id,
                    parent,
                    json.dumps(wire),
                    None if mask is None else json.dumps(mask),
                    *(columns[column] for column in (*_INDEXED.values(), *_EXTRA)),
                )
            )
        with self._db:
            self._db.executemany(_UPSERT, rows)

    def update_many(
        self,
        kind: str,
        items: Iterable[WireModel],
        *,
        index: dict[str, dict[str, Any]] | None = None,
    ) -> None:
        """Rewrites existing rows' data and indexed columns, leaving their
        parent and mask as they are: what a change to an annotation's
        partition needs, read and written as a header without its mask.
        Columns given only through ``index`` (the margin) are cleared
        unless passed again."""
        rows = []
        for model in items:
            wire = model.to_wire()
            wire.pop("encodedMask", None)
            columns: dict[str, Any] = {column: wire.get(field) for field, column in _INDEXED.items()}
            columns.update({column: None for column in _EXTRA})
            if index and wire["id"] in index:
                columns.update(index[wire["id"]])
            rows.append(
                (
                    json.dumps(wire),
                    *(columns[column] for column in (*_INDEXED.values(), *_EXTRA)),
                    kind,
                    wire["id"],
                )
            )
        with self._db:
            self._db.executemany(_UPDATE, rows)

    @staticmethod
    def _load(model: type[M], data: str, mask: str | None) -> M:
        wire = json.loads(data)
        if mask is not None and "encoded_mask" in model.model_fields:
            wire["encodedMask"] = json.loads(mask)
        return model.model_validate(wire)

    def get(self, kind: str, id: str, model: type[M]) -> M | None:
        row = self._db.execute(
            "SELECT data, mask FROM entities WHERE kind = ? AND id = ?", (kind, id)
        ).fetchone()
        return None if row is None else self._load(model, *row)

    def get_many(self, kind: str, ids: Sequence[str], model: type[M]) -> dict[str, M]:
        found: dict[str, M] = {}
        for chunk in _chunks(ids):
            rows = self._db.execute(
                f"SELECT id, data, mask FROM entities WHERE kind = ? AND id IN ({', '.join('?' * len(chunk))})",
                (kind, *chunk),
            )
            for id, data, mask in rows:
                found[id] = self._load(model, data, mask)
        return found

    def list(
        self,
        kind: str,
        model: type[M],
        *,
        parent: str | None = None,
        parents: Iterable[str] | None = None,
    ) -> list[M]:
        """Rows of a kind in insertion order, optionally under one parent or
        any of several."""
        if parents is not None:
            parent_list = list(parents)
            items: list[M] = []
            for chunk in _chunks(parent_list):
                rows = self._db.execute(
                    f"SELECT data, mask FROM entities WHERE kind = ? AND parent IN ({', '.join('?' * len(chunk))}) "
                    "ORDER BY rowid",
                    (kind, *chunk),
                )
                items.extend(self._load(model, *row) for row in rows)
            return items
        if parent is not None:
            rows = self._db.execute(
                "SELECT data, mask FROM entities WHERE kind = ? AND parent = ? ORDER BY rowid",
                (kind, parent),
            )
        else:
            rows = self._db.execute(
                "SELECT data, mask FROM entities WHERE kind = ? ORDER BY rowid", (kind,)
            )
        return [self._load(model, *row) for row in rows]

    def ids(self, kind: str, *, parents: Iterable[str] | None = None) -> list[str]:
        if parents is not None:
            found: list[str] = []
            for chunk in _chunks(list(parents)):
                rows = self._db.execute(
                    f"SELECT id FROM entities WHERE kind = ? AND parent IN ({', '.join('?' * len(chunk))}) "
                    "ORDER BY rowid",
                    (kind, *chunk),
                )
                found.extend(row[0] for row in rows)
            return found
        rows = self._db.execute("SELECT id FROM entities WHERE kind = ? ORDER BY rowid", (kind,))
        return [row[0] for row in rows]

    def delete(self, kind: str, ids: Iterable[str]) -> None:
        with self._db:
            self._db.executemany(
                "DELETE FROM entities WHERE kind = ? AND id = ?", [(kind, id) for id in ids]
            )

    # ── Filtered queries ─────────────────────────────────────────────────────
    #
    # Callers phrase conditions over the alias ``e`` (the rows of ``kind``)
    # and may join other kinds for sort keys; see ``piximi_engine.query``.

    @staticmethod
    def _where(kind: str, clauses: Sequence[Clause]) -> tuple[str, list[Any]]:
        sql = " AND ".join(["e.kind = ?", *(clause.sql for clause in clauses)])
        params: list[Any] = [kind]
        for clause in clauses:
            params.extend(clause.params)
        return sql, params

    def where_sql(self, kind: str, clauses: Sequence[Clause] = ()) -> tuple[str, list[Any]]:
        """The ``WHERE`` body and its parameters for rows of ``kind`` under
        the ``e`` alias, for a caller composing its own statement."""
        return self._where(kind, clauses)

    def rows(self, sql: str, params: Sequence[Any] = ()) -> list[tuple[Any, ...]]:
        """Runs a read-only statement a caller composed."""
        return self._db.execute(sql, tuple(params)).fetchall()

    def execute(self, sql: str, params: Sequence[Any] = ()) -> int:
        """Runs a statement that writes, in its own transaction; returns the
        rows it changed."""
        with self._db:
            return self._db.execute(sql, tuple(params)).rowcount

    def select_ids(
        self,
        kind: str,
        *,
        where: Sequence[Clause] = (),
        joins: str = "",
        order: str | Clause = "e.rowid",
        offset: int = 0,
        limit: int | None = None,
    ) -> list[str]:
        """Ids of the rows matching ``where``, in ``order`` (a column
        expression, or a clause when the ordering takes parameters)."""
        if isinstance(order, str):
            order = Clause(order)
        sql, params = self._where(kind, where)
        params.extend(order.params)
        query = f"SELECT e.id FROM entities e {joins} WHERE {sql} ORDER BY {order.sql}"
        if limit is not None:
            query += " LIMIT ? OFFSET ?"
            params.extend((limit, offset))
        return [row[0] for row in self._db.execute(query, params)]

    def count(self, kind: str, *, where: Sequence[Clause] = (), joins: str = "") -> int:
        sql, params = self._where(kind, where)
        return self._db.execute(f"SELECT COUNT(*) FROM entities e {joins} WHERE {sql}", params).fetchone()[0]

    def count_by(
        self, kind: str, column: str, *, where: Sequence[Clause] = (), joins: str = ""
    ) -> dict[str, int]:
        """Row counts per distinct value of an indexed column (``NULL`` is
        left out)."""
        sql, params = self._where(kind, where)
        rows = self._db.execute(
            f"SELECT e.{column}, COUNT(*) FROM entities e {joins} WHERE {sql} AND e.{column} IS NOT NULL "
            f"GROUP BY e.{column}",
            params,
        )
        return {value: count for value, count in rows}

    @staticmethod
    def in_clause(column: str, values: Sequence[Any]) -> Clause:
        """``column IN (...)``; an empty list matches nothing."""
        if not values:
            return Clause("0")
        return Clause(f"e.{column} IN ({', '.join('?' * len(values))})", tuple(values))

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
