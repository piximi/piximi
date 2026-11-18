"""Queries over a project of thousands of images stay cheap: one SQL
statement per page, never a pass over every row in Python."""

import time
from pathlib import Path

import pytest

from piximi_engine import ReferenceEngine
from piximi_engine.testing.bulk import populate
from piximi_schema.query import AnnotationQuery, AnnotationSort, ImageQuery, ImageSort, PageRequest

IMAGES = 2000
OBJECTS = 10


@pytest.fixture(scope="module")
def big(tmp_path_factory: pytest.TempPathFactory) -> ReferenceEngine:
    engine = ReferenceEngine(tmp_path_factory.mktemp("bulk"), models={})
    added = populate(engine, IMAGES, objects=OBJECTS, pixels=False)
    assert added == {"images": IMAGES, "annotations": IMAGES * OBJECTS}
    return engine


async def timed(coro):
    started = time.perf_counter()
    result = await coro
    return result, time.perf_counter() - started


async def test_pages_from_the_middle_of_a_sorted_listing(big: ReferenceEngine):
    page, seconds = await timed(
        big.images(ImageQuery(), ImageSort(key="name"), PageRequest(offset=IMAGES // 2, limit=50))
    )
    assert page.total == IMAGES and len(page.items) == 50
    names = [record.image.name.lower() for record in page.items]
    assert names == sorted(names)
    assert all(record.planes and len(record.channels) == 2 for record in page.items)
    assert seconds < 3, f"page took {seconds:.2f}s"


async def test_filters_and_counts_agree(big: ReferenceEngine):
    counts, seconds = await timed(big.image_counts(ImageQuery(annotated=True), "partition"))
    assert counts.total == IMAGES and sum(counts.groups.values()) == IMAGES
    assert seconds < 3
    for partition, count in counts.groups.items():
        page = await big.images(ImageQuery(partitions=[partition]), None, PageRequest(limit=1))
        assert page.total == count
    scored = await big.image_ids(ImageQuery(confidence={"min": 0.25, "max": 0.75}))
    assert 0 < len(scored) < counts.groups["Inference"]


async def test_annotation_listings_scale(big: ReferenceEngine):
    kinds = await big.annotation_counts(AnnotationQuery(), "kind")
    (kind_id, total), = kinds.groups.items()
    assert total == IMAGES * OBJECTS
    page, seconds = await timed(
        big.annotations(
            AnnotationQuery(kind_ids=[kind_id]), AnnotationSort(key="random", seed=5), PageRequest(offset=IMAGES * OBJECTS // 2, limit=100)
        )
    )
    assert page.total == total and len(page.items) == 100
    assert seconds < 3, f"page took {seconds:.2f}s"
    by_image = await big.annotation_ids(AnnotationQuery(image_ids=[page.items[0].annotation.image_id]))
    assert len(by_image) == OBJECTS
