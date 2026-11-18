"""The contract's queries and sorts as store clauses.

Conditions apply to the alias ``e`` (the rows being listed); a sort on
another entity's field joins it. Ties in every sort fall back to insertion
order, and ``desc`` reverses the whole order, ties included, so the two
directions are mirror images.
"""

from __future__ import annotations

from piximi_link.errors import BackendError
from piximi_schema.query import (
    AnnotationCountGroup,
    AnnotationQuery,
    AnnotationSort,
    AnnotationSortKey,
    ConfidenceRange,
    ImageCountGroup,
    ImageQuery,
    ImageSort,
    ImageSortKey,
    SortDirection,
)

from .store import Clause, MetaStore

_NAME = "COLLATE NOCASE"
_CATEGORY_JOIN = "LEFT JOIN entities c ON c.kind = 'category' AND c.id = e.category_id"
_IMAGE_JOIN = "LEFT JOIN entities i ON i.kind = 'image' AND i.id = e.image_id"
_PLANE_JOIN = "LEFT JOIN entities p ON p.kind = 'plane' AND p.id = e.plane_id"
_HAS_ANNOTATION = "EXISTS (SELECT 1 FROM entities a WHERE a.kind = 'annotation' AND a.image_id = e.id)"

IMAGE_COUNT_COLUMNS = {ImageCountGroup.CATEGORY: "category_id", ImageCountGroup.PARTITION: "partition"}
ANNOTATION_COUNT_COLUMNS = {
    AnnotationCountGroup.CATEGORY: "category_id",
    AnnotationCountGroup.PARTITION: "partition",
    AnnotationCountGroup.KIND: "kind_id",
}


def _confidence(range: ConfidenceRange) -> Clause:
    return Clause("e.confidence > ? AND e.confidence < ?", (range.min, range.max))


def image_clauses(query: ImageQuery) -> list[Clause]:
    clauses: list[Clause] = []
    if query.ids is not None:
        clauses.append(MetaStore.in_clause("id", query.ids))
    if query.series_ids is not None:
        clauses.append(MetaStore.in_clause("series_id", query.series_ids))
    if query.category_ids is not None:
        clauses.append(MetaStore.in_clause("category_id", query.category_ids))
    if query.partitions is not None:
        clauses.append(MetaStore.in_clause("partition", [p.value for p in query.partitions]))
    if query.confidence is not None:
        clauses.append(_confidence(query.confidence))
    if query.annotated is not None:
        clauses.append(Clause(_HAS_ANNOTATION if query.annotated else f"NOT {_HAS_ANNOTATION}"))
    return clauses


def annotation_clauses(query: AnnotationQuery) -> list[Clause]:
    clauses: list[Clause] = []
    for column, values in (
        ("id", query.ids),
        ("image_id", query.image_ids),
        ("plane_id", query.plane_ids),
        ("volume_id", query.volume_ids),
        ("kind_id", query.kind_ids),
        ("category_id", query.category_ids),
    ):
        if values is not None:
            clauses.append(MetaStore.in_clause(column, values))
    if query.partitions is not None:
        clauses.append(MetaStore.in_clause("partition", [p.value for p in query.partitions]))
    if query.confidence is not None:
        clauses.append(_confidence(query.confidence))
    return clauses


def _order(keys: list[str], direction: SortDirection, params: tuple = ()) -> Clause:
    suffix = " DESC" if direction == SortDirection.DESC else ""
    return Clause(", ".join(f"{key}{suffix}" for key in [*keys, "e.rowid"]), params)


def image_order(sort: ImageSort | None) -> tuple[str, Clause]:
    """``(joins, order)`` for a sort."""
    sort = sort or ImageSort()
    match sort.key:
        case ImageSortKey.NONE:
            return "", _order([], sort.direction)
        case ImageSortKey.NAME:
            return "", _order([f"e.name {_NAME}"], sort.direction)
        case ImageSortKey.CATEGORY:
            return _CATEGORY_JOIN, _order([f"c.name {_NAME}"], sort.direction)
        case ImageSortKey.RANDOM:
            return "", _order(["piximi_rand(?, e.id)"], sort.direction, (sort.seed or 0,))
        case ImageSortKey.SOFTMAX:
            raise BackendError("NOT_SUPPORTED", "This backend holds no classifier predictions to sort by")


def annotation_order(sort: AnnotationSort | None) -> tuple[str, Clause]:
    sort = sort or AnnotationSort()
    match sort.key:
        case AnnotationSortKey.NONE:
            return "", _order([], sort.direction)
        case AnnotationSortKey.PLANE:
            return _PLANE_JOIN, _order(["p.z_index"], sort.direction)
        case AnnotationSortKey.VOLUME:
            return "", _order(["e.volume_id"], sort.direction)
        case AnnotationSortKey.CATEGORY:
            return _CATEGORY_JOIN, _order([f"c.name {_NAME}"], sort.direction)
        case AnnotationSortKey.IMAGE:
            return _IMAGE_JOIN, _order([f"i.name {_NAME}"], sort.direction)
        case AnnotationSortKey.RANDOM:
            return "", _order(["piximi_rand(?, e.id)"], sort.direction, (sort.seed or 0,))
        case AnnotationSortKey.SOFTMAX:
            raise BackendError("NOT_SUPPORTED", "This backend holds no classifier predictions to sort by")
