"""Measurement tables straight from the store.

The values live in each entity's JSON (an object's ``features`` and
``intensityMeasurements``, a channel's statistics), so SQLite's JSON
functions pull them without loading rows into Python: one statement per
kind of column over the page's ids. Intensities are keyed by channel id in
the JSON, so the channel row is joined to reach its meta.
"""

from __future__ import annotations

from collections import defaultdict
from collections.abc import Iterator, Sequence
from typing import Any

from piximi_link.errors import BackendError
from piximi_schema.entities import AnnotationObject, AnnotationVolume, Channel, Partition
from piximi_schema.classification import AnnotationUpdate
from piximi_schema.measurements import (
    MeasurementColumn,
    MeasurementTable,
    MeasurementTableRequest,
    TablePageRequest,
    parse_column,
)
from piximi_schema.query import AnnotationQuery, ImageQuery

from .measure import intensity_measurements, object_features
from .query import annotation_clauses, image_clauses
from .rle import decode_mask
from .store import Clause, MetaStore, PixelStore, annotation_index

_CHUNK = 900
"""Ids per ``IN (...)``, under SQLite's default variable limit."""

Columns = list[tuple[str, MeasurementColumn]]


def _chunks(values: Sequence[str]) -> Iterator[Sequence[str]]:
    for start in range(0, len(values), _CHUNK):
        yield values[start : start + _CHUNK]


def _window(sql: str, page: TablePageRequest | None) -> tuple[str, tuple[Any, ...]]:
    if page is None:
        return sql, ()
    return sql + " LIMIT ? OFFSET ?", (page.limit, page.offset)


def measurement_table(meta: MetaStore, request: MeasurementTableRequest) -> MeasurementTable:
    try:
        columns: Columns = [(key, parse_column(key)) for key in request.columns]
    except ValueError as error:
        raise BackendError("NOT_SUPPORTED", str(error)) from None
    if request.scope.type == "images":
        return _images(meta, request, columns)
    if request.scope.kind_id is None:
        raise BackendError("NOT_SUPPORTED", "An objects scope names its kind")
    return _objects(meta, request, request.scope.kind_id, columns)


def _objects(meta: MetaStore, request: MeasurementTableRequest, kind_id: str, columns: Columns) -> MeasurementTable:
    query = request.annotation_query or AnnotationQuery()
    # The scope's kind bounds whatever the query asks for.
    kind_ids = [kind_id] if query.kind_ids is None else [id for id in query.kind_ids if id == kind_id]
    where = annotation_clauses(query.model_copy(update={"kind_ids": kind_ids}))
    total = meta.count("annotation", where=where)
    sql, params = meta.where_sql("annotation", where)
    rows_sql, window = _window(
        "SELECT e.id, e.image_id, e.category_id, e.partition, i.name, json_extract(i.data, '$.timepoint'), "
        "json_extract(e.data, '$.boundingBox[0]'), json_extract(e.data, '$.boundingBox[1]'), "
        "json_extract(e.data, '$.boundingBox[2]'), json_extract(e.data, '$.boundingBox[3]') "
        f"FROM entities e LEFT JOIN entities i ON i.kind = 'image' AND i.id = e.image_id WHERE {sql} "
        "ORDER BY e.rowid",
        request.page,
    )
    rows = meta.rows(rows_sql, (*params, *window))
    ids = [row[0] for row in rows]
    return MeasurementTable(
        ids=ids,
        image_ids=[row[1] for row in rows],
        image_names=[row[4] or "" for row in rows],
        category_ids=[row[2] for row in rows],
        partitions=[Partition(row[3]) for row in rows],
        timepoints=[int(row[5] or 0) for row in rows],
        bounding_boxes=[(row[6], row[7], row[8], row[9]) for row in rows],
        values=_values(meta, "annotation", ids, columns),
        total=total,
    )


def _images(meta: MetaStore, request: MeasurementTableRequest, columns: Columns) -> MeasurementTable:
    if any(column[0] == "feature" for _, column in columns):
        raise BackendError("NOT_SUPPORTED", "Images have no shape features; ask for intensity columns")
    where = image_clauses(request.image_query or ImageQuery())
    total = meta.count("image", where=where)
    sql, params = meta.where_sql("image", where)
    rows_sql, window = _window(
        "SELECT e.id, e.name, e.category_id, e.partition, json_extract(e.data, '$.timepoint') "
        f"FROM entities e WHERE {sql} ORDER BY e.rowid",
        request.page,
    )
    rows = meta.rows(rows_sql, (*params, *window))
    ids = [row[0] for row in rows]
    return MeasurementTable(
        ids=ids,
        image_names=[row[1] for row in rows],
        category_ids=[row[2] for row in rows],
        partitions=[Partition(row[3]) for row in rows],
        timepoints=[int(row[4] or 0) for row in rows],
        values=_values(meta, "image", ids, columns),
        total=total,
    )


def _values(meta: MetaStore, kind: str, ids: list[str], columns: Columns) -> dict[str, list[float | None]]:
    """Each requested column over ``ids``; what no row carries stays ``None``."""
    index = {id: position for position, id in enumerate(ids)}
    values: dict[str, list[float | None]] = {key: [None] * len(ids) for key, _ in columns}
    features = [(key, column[1].value) for key, column in columns if column[0] == "feature"]
    by_meta: dict[str, list[tuple[str, str]]] = defaultdict(list)
    for key, column in columns:
        if column[0] == "intensity":
            by_meta[column[2]].append((key, column[1].value))

    def fill(sql: str, params: Sequence[Any], wanted: list[tuple[str, str]]) -> None:
        for row in meta.rows(sql, params):
            position = index[row[0]]
            for (key, _), value in zip(wanted, row[1:], strict=True):
                values[key][position] = value

    for chunk in _chunks(ids):
        marks = ", ".join("?" * len(chunk))
        if features:
            selects = ", ".join(f"json_extract(e.data, '$.features.{name}')" for _, name in features)
            fill(
                f"SELECT e.id, {selects} FROM entities e WHERE e.kind = ? AND e.id IN ({marks})",
                (kind, *chunk),
                features,
            )
        for meta_id, wanted in by_meta.items():
            if kind == "annotation":
                selects = ", ".join(f"json_extract(j.value, '$.{name}')" for _, name in wanted)
                # CROSS JOIN fixes the order object -> unnested channel -> channel
                # row, so the channel is found by its key; left to itself the
                # planner puts the virtual table last and scans every channel
                # per object (seconds per chunk instead of milliseconds).
                fill(
                    f"SELECT e.id, {selects} FROM entities e "
                    "CROSS JOIN json_each(json_extract(e.data, '$.intensityMeasurements')) AS j "
                    "CROSS JOIN entities c ON c.kind = 'channel' AND c.id = j.key "
                    f"WHERE e.kind = 'annotation' AND e.id IN ({marks}) "
                    "AND json_extract(c.data, '$.channelMetaId') = ?",
                    (*chunk, meta_id),
                    wanted,
                )
            else:
                selects = ", ".join(f"json_extract(c.data, '$.{name}')" for _, name in wanted)
                fill(
                    f"SELECT e.id, {selects} FROM entities e "
                    "JOIN entities c ON c.kind = 'channel' AND c.plane_id = json_extract(e.data, '$.activePlaneId') "
                    "AND json_extract(c.data, '$.channelMetaId') = ? "
                    f"WHERE e.kind = 'image' AND e.id IN ({marks})",
                    (meta_id, *chunk),
                    wanted,
                )
    return values


# ── Measuring on demand ─────────────────────────────────────────────────────

_UNMEASURED = Clause(
    "(json_extract(e.data, '$.features') IS NULL OR json_extract(e.data, '$.intensityMeasurements') IS NULL)"
)


def unmeasured_ids(meta: MetaStore, query: AnnotationQuery, force: bool) -> list[str]:
    """The matching objects that lack features or intensities, or all of
    them with ``force``, in insertion order."""
    where = annotation_clauses(query)
    if not force:
        where = [*where, _UNMEASURED]
    return meta.select_ids("annotation", where=where)


def measure_annotations(meta: MetaStore, pixels: PixelStore, ids: Sequence[str]) -> list[AnnotationUpdate]:
    """Computes every feature and intensity of ``ids`` from their stored
    masks and pixels and rewrites their headers, keeping the mask column and
    the volume-derived index; returns what was rewritten."""
    objects = meta.get_many("annotation", list(ids), AnnotationObject)
    volumes = meta.get_many("volume", sorted({o.volume_id for o in objects.values()}), AnnotationVolume)
    channels_by_plane: dict[str, list[Channel]] = defaultdict(list)
    for channel in meta.list("channel", Channel, parents=sorted({o.plane_id for o in objects.values()})):
        channels_by_plane[channel.plane_id].append(channel)
    measured: list[AnnotationObject] = []
    index: dict[str, dict[str, Any]] = {}
    for id in ids:
        obj = objects.get(id)
        volume = volumes.get(obj.volume_id) if obj is not None else None
        if obj is None or volume is None:
            continue
        x0, y0, x1, y1 = obj.bounding_box
        mask = decode_mask(obj.encoded_mask, (y1 - y0, x1 - x0))
        intensities = {}
        for channel in channels_by_plane.get(obj.plane_id, []):
            stats = intensity_measurements(mask, pixels.get(channel.id, obj.bounding_box))
            if stats is not None:
                intensities[channel.id] = stats
        # Validated rather than copied, so the measurement keys are the enums
        # the model declares and serialise as such.
        measured.append(
            AnnotationObject.model_validate(
                {**obj.model_dump(), "features": object_features(mask) or None, "intensityMeasurements": intensities or None}
            )
        )
        index[obj.id] = annotation_index(volume)
    meta.update_many("annotation", measured, index=index)
    return [AnnotationUpdate(id=obj.id, partition=obj.partition) for obj in measured]
