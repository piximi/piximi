"""Loading a project given as wire dicts, and running the query vectors.

The dataset shape is the one in ``tests/vectors/query.json``: lists of wire
entities per kind, with annotations carrying their masks. The frontend loads
the same file into its in-memory query module, so one set of expected ids
pins both implementations.
"""

from __future__ import annotations

from typing import Any

from pydantic import TypeAdapter
from piximi_schema.entities import (
    AnnotationObject,
    AnnotationVolume,
    Category,
    ImageObject,
    ImageSeries,
    Kind,
    Plane,
)
from piximi_schema.query import (
    AnnotationQuery,
    AnnotationSort,
    ImageQuery,
    ImageSort,
    PageRequest,
)

from ..store import MetaStore, annotation_index

_category = TypeAdapter(Category)


def load_dataset(meta: MetaStore, dataset: dict[str, list[dict[str, Any]]]) -> None:
    meta.put_many("series", [(ImageSeries.model_validate(row), None) for row in dataset.get("series", [])])
    meta.put_many("image", [(ImageObject.model_validate(row), row["seriesId"]) for row in dataset.get("images", [])])
    meta.put_many("plane", [(Plane.model_validate(row), row["imageId"]) for row in dataset.get("planes", [])])
    meta.put_many("kind", [(Kind.model_validate(row), None) for row in dataset.get("kinds", [])])
    meta.put_many("category", [(_category.validate_python(row), None) for row in dataset.get("categories", [])])
    volumes = [AnnotationVolume.model_validate(row) for row in dataset.get("volumes", [])]
    meta.put_many("volume", [(volume, volume.image_id) for volume in volumes])
    by_volume = {volume.id: volume for volume in volumes}
    annotations = [AnnotationObject.model_validate(row) for row in dataset.get("annotations", [])]
    meta.put_many(
        "annotation",
        [(annotation, annotation.image_id) for annotation in annotations],
        index={a.id: annotation_index(by_volume[a.volume_id]) for a in annotations},
    )


async def run_case(engine: Any, case: dict[str, Any]) -> dict[str, Any]:
    """Runs one vector case against an engine; the result has the same keys
    the case's expectations use (``ids``/``total`` or ``total``/``groups``)."""
    entity = case["entity"]
    if entity == "images":
        query = ImageQuery.model_validate(case.get("query", {}))
        sort = ImageSort.model_validate(case["sort"]) if case.get("sort") else None
        if case.get("page"):
            page = await engine.images(query, sort, PageRequest.model_validate(case["page"]))
            return {"ids": [record.image.id for record in page.items], "total": page.total}
        ids = await engine.image_ids(query, sort)
        return {"ids": ids, "total": len(ids)}
    if entity == "annotations":
        query = AnnotationQuery.model_validate(case.get("query", {}))
        sort = AnnotationSort.model_validate(case["sort"]) if case.get("sort") else None
        if case.get("page"):
            page = await engine.annotations(query, sort, PageRequest.model_validate(case["page"]))
            return {"ids": [record.annotation.id for record in page.items], "total": page.total}
        ids = await engine.annotation_ids(query, sort)
        return {"ids": ids, "total": len(ids)}
    if entity == "imageCounts":
        counts = await engine.image_counts(ImageQuery.model_validate(case.get("query", {})), case.get("groupBy"))
        return {"total": counts.total, "groups": counts.groups}
    if entity == "annotationCounts":
        counts = await engine.annotation_counts(
            AnnotationQuery.model_validate(case.get("query", {})), case.get("groupBy")
        )
        return {"total": counts.total, "groups": counts.groups}
    raise ValueError(f"Unknown entity {entity!r}")
