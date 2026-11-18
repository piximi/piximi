"""Writes ``query.json``: a small project and the ids every query and sort
must return. Run it after changing the dataset or the semantics and review
the diff; the hand-derived expectations below are checked on the way, and
the random orders come from the engine (the frontend must reproduce them).

    uv run python packages/piximi-engine/tests/vectors/gen_query.py
"""

from __future__ import annotations

import asyncio
import json
import tempfile
from pathlib import Path

from piximi_engine import ReferenceEngine
from piximi_engine.testing.dataset import load_dataset, run_case

SHAPE = {"planes": 1, "height": 4, "width": 4, "channels": 1}


def image(n: int, name: str, category: str, partition: str, confidence: float | None = None, series: str = "s-1"):
    row = {
        "id": f"img-{n}",
        "name": name,
        "seriesId": series,
        "shape": SHAPE,
        "categoryId": category,
        "activePlaneId": f"p-{n}" if n != 1 else "p-1a",
        "timepoint": 0,
        "bitDepth": 8,
        "partition": partition,
    }
    if confidence is not None:
        row["predictionConfidence"] = confidence
    return row


def series(id: str, active: str):
    return {
        "id": id,
        "experimentId": "exp",
        "name": id,
        "bitDepth": 8,
        "shape": SHAPE,
        "timeSeries": False,
        "activeImageId": active,
    }


def category(id: str, name: str, kind: str | None = None, unknown: bool = False):
    row = {"id": id, "color": "#808080", "name": name, "isUnknown": unknown}
    return {**row, "type": "annotation", "kindId": kind} if kind else {**row, "type": "image"}


def volume(id: str, image: str, kind: str, category: str, confidence: float | None = None):
    row = {"id": id, "imageId": image, "kindId": kind, "categoryId": category}
    if confidence is not None:
        row["predictionConfidence"] = confidence
    return row


def annotation(n: int, plane: str, image: str, vol: str, partition: str):
    return {
        "id": f"ann-{n}",
        "planeId": plane,
        "imageId": image,
        "volumeId": vol,
        "partition": partition,
        "shape": {"planes": 1, "height": 2, "width": 2, "channels": 1},
        "boundingBox": [0, 0, 2, 2],
        "encodedMask": [0, 4],
    }


DATASET = {
    "series": [series("s-1", "img-1"), series("s-2", "img-6")],
    "images": [
        image(1, "delta", "cat-a", "Training", 0.9),
        image(2, "Alpha", "cat-b", "Inference", 0.3),
        image(3, "charlie", "cat-unknown", "Unassigned"),
        image(4, "bravo", "cat-a", "Validation", 0.5),
        image(5, "echo", "cat-b", "Inference", 0.75),
        image(6, "alpha", "cat-unknown", "Training", series="s-2"),
    ],
    "planes": [
        {"id": "p-1a", "imageId": "img-1", "zIndex": 0},
        {"id": "p-1b", "imageId": "img-1", "zIndex": 1},
        *({"id": f"p-{n}", "imageId": f"img-{n}", "zIndex": 0} for n in range(2, 7)),
    ],
    "kinds": [
        {"id": "kind-1", "name": "Cell", "unknownCategoryId": "acat-u1"},
        {"id": "kind-2", "name": "Debris", "unknownCategoryId": "acat-u2"},
    ],
    "categories": [
        category("cat-unknown", "Unknown", unknown=True),
        category("cat-b", "beta"),
        category("cat-a", "Alpha"),
        category("acat-u1", "Unknown", kind="kind-1", unknown=True),
        category("acat-n", "nucleus", kind="kind-1"),
        category("acat-u2", "Unknown", kind="kind-2", unknown=True),
    ],
    "volumes": [
        volume("v-1", "img-1", "kind-1", "acat-n", 0.8),
        volume("v-2", "img-1", "kind-1", "acat-u1"),
        volume("v-3", "img-2", "kind-2", "acat-u2", 0.2),
        volume("v-4", "img-4", "kind-1", "acat-n"),
    ],
    "annotations": [
        annotation(1, "p-1b", "img-1", "v-1", "Training"),
        annotation(2, "p-1a", "img-1", "v-1", "Training"),
        annotation(3, "p-1a", "img-1", "v-2", "Unassigned"),
        annotation(4, "p-2", "img-2", "v-3", "Inference"),
        annotation(5, "p-4", "img-4", "v-4", "Validation"),
    ],
}


def img(*ns: int) -> list[str]:
    return [f"img-{n}" for n in ns]


def ann(*ns: int) -> list[str]:
    return [f"ann-{n}" for n in ns]


# (name, case, expected or None when the engine decides)
CASES = [
    ("images: insertion order", {"entity": "images"}, img(1, 2, 3, 4, 5, 6)),
    ("images: by name, case-insensitive, ties by insertion", {"entity": "images", "sort": {"key": "name"}}, img(2, 6, 4, 3, 1, 5)),
    ("images: by name descending reverses ties too", {"entity": "images", "sort": {"key": "name", "direction": "desc"}}, img(5, 1, 3, 4, 6, 2)),
    ("images: by category name", {"entity": "images", "sort": {"key": "category"}}, img(1, 4, 2, 5, 3, 6)),
    ("images: random seed 7", {"entity": "images", "sort": {"key": "random", "seed": 7}}, None),
    ("images: random seed 7 descending", {"entity": "images", "sort": {"key": "random", "seed": 7, "direction": "desc"}}, None),
    ("images: random seed 8 differs", {"entity": "images", "sort": {"key": "random", "seed": 8}}, None),
    ("images: by category ids", {"entity": "images", "query": {"categoryIds": ["cat-a", "cat-unknown"]}}, img(1, 3, 4, 6)),
    ("images: by partition", {"entity": "images", "query": {"partitions": ["Training"]}}, img(1, 6)),
    ("images: confidence strictly inside the range", {"entity": "images", "query": {"confidence": {"min": 0.4, "max": 0.8}}}, img(4, 5)),
    ("images: annotated", {"entity": "images", "query": {"annotated": True}}, img(1, 2, 4)),
    ("images: unannotated", {"entity": "images", "query": {"annotated": False}}, img(3, 5, 6)),
    ("images: by series", {"entity": "images", "query": {"seriesIds": ["s-2"]}}, img(6)),
    ("images: by ids keeps insertion order and drops unknown ids", {"entity": "images", "query": {"ids": ["img-5", "img-1", "nope"]}}, img(1, 5)),
    ("images: empty id list matches nothing", {"entity": "images", "query": {"ids": []}}, []),
    ("images: filters combine with a sort", {"entity": "images", "query": {"partitions": ["Training", "Inference"]}, "sort": {"key": "name"}}, img(2, 6, 1, 5)),
    ("images: a page of a sorted listing", {"entity": "images", "sort": {"key": "name"}, "page": {"offset": 2, "limit": 2}}, {"ids": img(4, 3), "total": 6}),
    ("images: a page past the end is empty", {"entity": "images", "page": {"offset": 6, "limit": 2}}, {"ids": [], "total": 6}),
    ("imageCounts: by category", {"entity": "imageCounts", "groupBy": "category"}, {"total": 6, "groups": {"cat-a": 2, "cat-b": 2, "cat-unknown": 2}}),
    ("imageCounts: by partition", {"entity": "imageCounts", "groupBy": "partition"}, {"total": 6, "groups": {"Training": 2, "Inference": 2, "Unassigned": 1, "Validation": 1}}),
    ("imageCounts: filtered, by partition", {"entity": "imageCounts", "query": {"annotated": True}, "groupBy": "partition"}, {"total": 3, "groups": {"Training": 1, "Inference": 1, "Validation": 1}}),
    ("imageCounts: total only", {"entity": "imageCounts", "query": {"categoryIds": ["cat-b"]}}, {"total": 2, "groups": None}),
    ("annotations: insertion order", {"entity": "annotations"}, ann(1, 2, 3, 4, 5)),
    ("annotations: by plane z-index", {"entity": "annotations", "sort": {"key": "plane"}}, ann(2, 3, 4, 5, 1)),
    ("annotations: by volume descending", {"entity": "annotations", "sort": {"key": "volume", "direction": "desc"}}, ann(5, 4, 3, 2, 1)),
    ("annotations: by category name", {"entity": "annotations", "sort": {"key": "category"}}, ann(1, 2, 5, 3, 4)),
    ("annotations: by image name", {"entity": "annotations", "sort": {"key": "image"}}, ann(4, 5, 1, 2, 3)),
    ("annotations: random seed 3", {"entity": "annotations", "sort": {"key": "random", "seed": 3}}, None),
    ("annotations: by kind", {"entity": "annotations", "query": {"kindIds": ["kind-1"]}}, ann(1, 2, 3, 5)),
    ("annotations: by category ids", {"entity": "annotations", "query": {"categoryIds": ["acat-n"]}}, ann(1, 2, 5)),
    ("annotations: by image ids", {"entity": "annotations", "query": {"imageIds": ["img-1"]}}, ann(1, 2, 3)),
    ("annotations: by plane ids", {"entity": "annotations", "query": {"planeIds": ["p-1a"]}}, ann(2, 3)),
    ("annotations: by volume ids", {"entity": "annotations", "query": {"volumeIds": ["v-1"]}}, ann(1, 2)),
    ("annotations: by partition", {"entity": "annotations", "query": {"partitions": ["Training"]}}, ann(1, 2)),
    ("annotations: confidence from the volume", {"entity": "annotations", "query": {"confidence": {"min": 0.1, "max": 0.5}}}, ann(4)),
    ("annotations: by ids", {"entity": "annotations", "query": {"ids": ["ann-4", "ann-1"]}}, ann(1, 4)),
    ("annotations: a page of a sorted listing", {"entity": "annotations", "sort": {"key": "image"}, "page": {"offset": 1, "limit": 3}}, {"ids": ann(5, 1, 2), "total": 5}),
    ("annotationCounts: by kind", {"entity": "annotationCounts", "groupBy": "kind"}, {"total": 5, "groups": {"kind-1": 4, "kind-2": 1}}),
    ("annotationCounts: by category", {"entity": "annotationCounts", "groupBy": "category"}, {"total": 5, "groups": {"acat-n": 3, "acat-u1": 1, "acat-u2": 1}}),
    ("annotationCounts: filtered, by partition", {"entity": "annotationCounts", "query": {"kindIds": ["kind-1"]}, "groupBy": "partition"}, {"total": 4, "groups": {"Training": 2, "Unassigned": 1, "Validation": 1}}),
]


async def main() -> None:
    with tempfile.TemporaryDirectory() as tmp:
        engine = ReferenceEngine(Path(tmp), models={})
        load_dataset(engine.meta, DATASET)
        cases = []
        for name, case, expected in CASES:
            result = await run_case(engine, case)
            if expected is not None:
                want = expected if isinstance(expected, dict) else {"ids": expected, "total": len(expected)}
                assert result == want, f"{name}: got {result}, expected {want}"
            else:
                assert sorted(result["ids"]) != result["ids"] or len(result["ids"]) < 3, f"{name}: not shuffled"
                print(f"{name}: {result['ids']}")
            cases.append({"name": name, **case, "expect": result})
        await engine.close()
    out = Path(__file__).with_name("query.json")
    out.write_text(json.dumps({"dataset": DATASET, "cases": cases}, indent=1) + "\n")
    print(f"wrote {len(cases)} cases to {out}")


if __name__ == "__main__":
    asyncio.run(main())
