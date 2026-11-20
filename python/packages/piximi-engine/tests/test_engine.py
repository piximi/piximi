import asyncio
from pathlib import Path

import numpy as np
import pytest

from piximi_engine import ReferenceEngine
from piximi_engine.models.threshold import ThresholdSegmenter
from piximi_engine.rle import decode_mask
from piximi_link.errors import BackendError
from piximi_link.peer import HandlerContext
from piximi_schema.entities import ImageObject, Kind
from piximi_schema.query import AnnotationQuery, ImageQuery, ImageSort, PageRequest
from piximi_schema.render import ChannelDisplay, RenderRequest
from piximi_schema.segmentation import SegmentationRunRequest

PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"


def ctx() -> HandlerContext:
    return HandlerContext(None)


def _name_of(engine: ReferenceEngine):
    return lambda id: engine.meta.get("image", id, ImageObject).name.lower()


async def test_softmax_sort_is_not_supported_here(engine: ReferenceEngine):
    with pytest.raises(BackendError) as info:
        await engine.images(ImageQuery(), ImageSort(key="softmax"), PageRequest(limit=1))
    assert info.value.code == "NOT_SUPPORTED"


async def all_images(engine: ReferenceEngine):
    page = await engine.images(ImageQuery(), None, PageRequest(limit=100))
    return {record.image.name: record for record in page.items}


def display(record, **overrides) -> list[ChannelDisplay]:
    return [
        ChannelDisplay(
            **{
                "channel_id": channel.id,
                "color_map": (1, 0, 0) if i == 0 else (0, 1, 0) if i == 1 else (0, 0, 1),
                "ramp_min": 0,
                "ramp_max": 2 ** int(channel.bit_depth) - 1,
                "visible": True,
                **overrides,
            }
        )
        for i, channel in enumerate(record.channels)
    ]


async def test_ingest_builds_the_project(engine: ReferenceEngine):
    summary = await engine.project()
    assert summary.counts.images == 3
    assert summary.counts.annotations == 0
    assert [kind.name for kind in summary.kinds] == ["Unknown"]
    assert len(summary.channel_metas) == 3  # the RGB image has the most channels

    records = await all_images(engine)
    a, b, c = records["a"], records["b"], records["c"]
    assert (a.image.shape.width, a.image.shape.height, a.image.shape.channels) == (40, 32, 1)
    assert (b.image.bit_depth, b.image.shape.channels) == (16, 2)
    assert c.image.shape.channels == 3
    assert len(a.planes) == 1 and len(a.channels) == 1
    assert {ch.channel_meta_id for ch in c.channels} == {"channel-meta-0", "channel-meta-1", "channel-meta-2"}


async def test_ingest_is_idempotent(images_dir: Path):
    engine = ReferenceEngine(images_dir / ".piximi", models={})
    first = engine.ingest_folder(images_dir)
    second = engine.ingest_folder(images_dir)
    assert len(first) == 3 and second == []
    assert engine.meta.count("image") == 3


async def test_images_page_without_gaps(engine: ReferenceEngine):
    seen = []
    offset = 0
    while True:
        page = await engine.images(ImageQuery(), None, PageRequest(offset=offset, limit=2))
        assert page.total == 3
        seen.extend(record.image.id for record in page.items)
        offset += len(page.items)
        if offset >= page.total:
            break
    assert len(seen) == 3 and len(set(seen)) == 3

    one = await engine.images(ImageQuery(ids=[seen[1], "nope"]), None, PageRequest(limit=10))
    assert [r.image.id for r in one.items] == [seen[1]] and one.total == 1
    assert await engine.image_ids(ImageQuery(), ImageSort(key="name")) == sorted(seen, key=_name_of(engine))


async def test_render_composites_to_png(engine: ReferenceEngine):
    records = await all_images(engine)
    a = records["a"]
    rendered = await engine.render_image(RenderRequest(channels=display(a)))
    assert (rendered.width, rendered.height, rendered.mime) == (40, 32, "image/png")
    assert rendered.data.startswith(PNG_SIGNATURE)

    cropped = await engine.render_image(RenderRequest(channels=display(a), region=(4, 4, 12, 12)))
    assert (cropped.width, cropped.height) == (8, 8)

    with pytest.raises(BackendError) as info:
        await engine.render_image(RenderRequest(channels=display(a, visible=False)))
    assert info.value.code == "NOT_FOUND"


async def test_thumbnails_stream_in_batches(engine: ReferenceEngine):
    records = await all_images(engine)
    requests = [RenderRequest(channels=display(r)) for r in records.values()]
    bad = RenderRequest(channels=[ChannelDisplay(channel_id="nope", color_map=(1, 0, 0), ramp_min=0, ramp_max=255, visible=True)])
    partials = []
    context = HandlerContext(partials.append)

    result = await engine.render_thumbnails([*requests, bad], context)

    assert (result.rendered, result.failed) == (3, 1)
    results = [r for partial in partials for r in partial["results"]]
    assert sorted(r["index"] for r in results) == [0, 1, 2, 3]
    assert results[-1]["status"] == "failed" and results[-1]["error"]["code"] == "NOT_FOUND"


async def test_segmentation_adds_objects_and_emits_events(engine: ReferenceEngine):
    records = await all_images(engine)
    a, b = records["a"], records["b"]
    events = []
    engine.subscribe(events.append)
    progress = []
    context = HandlerContext(progress.append)

    summary = await engine.segmentation_run(
        SegmentationRunRequest(model_id="threshold", image_ids=[a.image.id, b.image.id], channel_meta_ids=[], kind_name="Cell"),
        context,
    )

    assert summary.cancelled is False and summary.skipped == 0
    # Two squares in `a`; `b` averages its channels, so each square is dimmer but still above Otsu.
    assert summary.added == 4
    kinds = [e for e in events if e.type == "kinds/didAdd"]
    added = [e for e in events if e.type == "annotations/didAdd"]
    jobs = [e for e in events if e.type == "jobs/didUpdate"]
    assert len(kinds) == 1 and kinds[0].kinds[0].kind.name == "Cell"
    assert len(added) == 1 and len(added[0].annotations) == 4 == len(added[0].volumes)
    assert jobs[-1].job.status == "succeeded" and jobs[-1].job.id == summary.job_id
    assert progress[-1]["percent"] == 100

    annotation = added[0].annotations[0]
    x0, y0, x1, y1 = annotation.bounding_box
    assert annotation.shape.width == x1 - x0 and annotation.shape.height == y1 - y0
    mask = decode_mask(annotation.encoded_mask, (y1 - y0, x1 - x0))
    assert mask.all()  # squares fill their bounding boxes
    assert annotation.features["area"] == float(mask.sum())
    assert annotation.intensity_measurements and all(
        "mean" in stats for stats in annotation.intensity_measurements.values()
    )

    page = await engine.annotations(AnnotationQuery(image_ids=[a.image.id]), None, PageRequest(limit=10))
    assert page.total == 2 and not hasattr(page.items[0].annotation, "encoded_mask")
    masks = await engine.masks([annotation.id])
    assert masks[annotation.id] == annotation.encoded_mask

    # Running again over the same images finds only duplicates.
    again = await engine.segmentation_run(
        SegmentationRunRequest(model_id="threshold", image_ids=[a.image.id, b.image.id], channel_meta_ids=[], kind_name="Cell"),
        ctx(),
    )
    assert (again.added, again.skipped) == (0, 4)


async def test_segmentation_selects_channels_by_meta(engine: ReferenceEngine):
    records = await all_images(engine)
    b = records["b"]
    # Only the first channel: one square instead of two.
    summary = await engine.segmentation_run(
        SegmentationRunRequest(model_id="threshold", image_ids=[b.image.id], channel_meta_ids=["channel-meta-0"], kind_name="One"),
        ctx(),
    )
    assert summary.added == 1


async def test_segmentation_cancelled_before_start(engine: ReferenceEngine):
    records = await all_images(engine)
    context = HandlerContext(None)
    context._cancelled.set()
    summary = await engine.segmentation_run(
        SegmentationRunRequest(model_id="threshold", image_ids=[r.image.id for r in records.values()], channel_meta_ids=[]),
        context,
    )
    assert summary.cancelled is True and summary.added == 0
    assert (await engine.jobs_list())[-1].status == "cancelled"


async def test_segmentation_cancelled_through_the_job(engine: ReferenceEngine):
    records = await all_images(engine)
    ids = [r.image.id for r in records.values()]
    context = HandlerContext(None)

    class Slow(ThresholdSegmenter):
        def segment(self, image, options, kind_name, ctx):
            import time

            time.sleep(0.05)
            return super().segment(image, options, kind_name, ctx)

    engine._models["threshold"] = Slow()
    task = asyncio.create_task(
        engine.segmentation_run(SegmentationRunRequest(model_id="threshold", image_ids=ids, channel_meta_ids=[]), context)
    )
    await asyncio.sleep(0.02)
    job = (await engine.jobs_list())[-1]
    await engine.jobs_cancel(job.id)
    summary = await task
    assert summary.cancelled is True
    assert summary.added < 4


async def test_unknown_model_and_image(engine: ReferenceEngine):
    with pytest.raises(BackendError) as info:
        await engine.segmentation_run(SegmentationRunRequest(model_id="nope", image_ids=[], channel_meta_ids=[]), ctx())
    assert info.value.code == "MODEL_NOT_FOUND"
    with pytest.raises(BackendError) as info:
        await engine.segmentation_run(SegmentationRunRequest(model_id="threshold", image_ids=["nope"], channel_meta_ids=[]), ctx())
    assert info.value.code == "NOT_FOUND"


def test_pixels_round_trip_through_zarr(engine: ReferenceEngine):
    channel_id = engine.meta.ids("channel")[0]
    full = engine.pixels.get(channel_id)
    region = engine.pixels.get(channel_id, (2, 3, 10, 7))
    assert np.array_equal(region, full[3:7, 2:10])


async def test_deleting_annotations_and_images_cascades_and_announces(engine: ReferenceEngine):
    records = await all_images(engine)
    a, b = records["a"], records["b"]
    await engine.segmentation_run(
        SegmentationRunRequest(model_id="threshold", image_ids=[a.image.id, b.image.id], channel_meta_ids=[], kind_name="Cell"),
        ctx(),
    )
    events = []
    engine.subscribe(events.append)
    kind = next(k for k in engine.meta.list("kind", Kind) if k.name == "Cell")

    # Nothing matching: nothing happens.
    assert await engine.annotations_delete(AnnotationQuery(kind_ids=["nope"])) == 0
    assert events == []

    # Only `a`'s objects: `b` keeps its two, and their volumes.
    deleted = await engine.annotations_delete(AnnotationQuery(kind_ids=[kind.id], image_ids=[a.image.id]))
    assert deleted == 2
    assert (await engine.annotation_counts(AnnotationQuery())).total == 2
    assert engine.meta.count("volume") == 2
    removed = events[-1]
    assert removed.type == "annotations/didRemove"
    assert len(removed.annotation_ids) == 2 == len(removed.volume_ids)

    # The image itself: planes, channels, pixels, objects and its series go.
    channel_ids = [channel.id for channel in b.channels]
    deleted = await engine.images_delete(ImageQuery(ids=[b.image.id, "nope"]))
    assert deleted == 1
    assert events[-1].type == "images/didRemove" and events[-1].image_ids == [b.image.id]
    assert (await engine.image_counts(ImageQuery())).total == 2
    assert (await engine.annotation_counts(AnnotationQuery())).total == 0
    assert engine.meta.count("plane") == 2 and engine.meta.get("series", b.series.id, type(b.series)) is None
    assert all(channel_id not in engine.pixels for channel_id in channel_ids)
    assert await engine.images_delete(ImageQuery(ids=[b.image.id])) == 0


async def test_categories_and_categorizing(engine: ReferenceEngine):
    from piximi_schema.entities import AnnotationCategory, ImageCategory, Partition
    from piximi_schema.unknown import UNKNOWN_IMAGE_CATEGORY_ID, generate_uuid

    records = await all_images(engine)
    a, b = records["a"], records["b"]
    events = []
    engine.subscribe(events.append)

    cells = ImageCategory(type="image", id=generate_uuid(), color="#ff0000", name="Cells", is_unknown=False)
    assert await engine.categories_create([cells]) == [cells]
    assert events[-1].type == "categories/didChange"
    assert any(category.id == cells.id for category in events[-1].categories)

    # Categorizing by query: a hand-made change, so unassigned items stay so.
    assert await engine.images_categorize(ImageQuery(ids=[a.image.id, b.image.id]), cells.id) == 2
    update = events[-1]
    assert update.type == "images/didUpdate"
    assert {u.id for u in update.updates} == {a.image.id, b.image.id}
    assert all(u.category_id == cells.id and u.partition == Partition.UNASSIGNED for u in update.updates)
    assert (await engine.image_counts(ImageQuery(), "category")).groups[cells.id] == 2
    assert await engine.images_categorize(ImageQuery(ids=[a.image.id]), cells.id) == 0

    # Back to unknown sends an item to inference.
    assert await engine.images_categorize(ImageQuery(ids=[a.image.id]), UNKNOWN_IMAGE_CATEGORY_ID) == 1
    assert events[-1].updates[0].partition == Partition.INFERENCE

    renamed = await engine.categories_update(cells.id, "Nuclei", None)
    assert (renamed.name, renamed.color) == ("Nuclei", "#ff0000")

    # Objects move through their volume, every plane's annotation with it.
    await engine.segmentation_run(
        SegmentationRunRequest(model_id="threshold", image_ids=[a.image.id], channel_meta_ids=[], kind_name="Cell"),
        ctx(),
    )
    kind = next(k for k in engine.meta.list("kind", Kind) if k.name == "Cell")
    round_ = AnnotationCategory(
        type="annotation", id=generate_uuid(), color="#00ff00", name="Round", is_unknown=False, kind_id=kind.id
    )
    await engine.categories_create([round_])
    first = (await engine.annotations(AnnotationQuery(kind_ids=[kind.id]), None, PageRequest(limit=1))).items[0]
    assert await engine.annotations_categorize(AnnotationQuery(ids=[first.annotation.id]), round_.id) == 1
    moved = events[-1]
    assert moved.type == "annotations/didUpdate"
    assert moved.volumes[0].id == first.volume.id and moved.volumes[0].category_id == round_.id
    assert (await engine.annotation_counts(AnnotationQuery(kind_ids=[kind.id]), "category")).groups[round_.id] == 1
    page = await engine.annotations(AnnotationQuery(category_ids=[round_.id]), None, PageRequest(limit=10))
    assert [record.annotation.id for record in page.items] == [first.annotation.id]
    # The mask survived the rewrite.
    assert (await engine.masks([first.annotation.id]))[first.annotation.id]

    # Deleting returns items to unknown; the reserved unknown stays.
    assert await engine.categories_delete([cells.id, round_.id, UNKNOWN_IMAGE_CATEGORY_ID, "nope"]) == 2
    assert (await engine.image_counts(ImageQuery(category_ids=[cells.id]))).total == 0
    assert (await engine.annotation_counts(AnnotationQuery(category_ids=[round_.id]))).total == 0
    assert all(c.id not in (cells.id, round_.id) for c in (await engine.project()).categories)
    kept = engine.meta.get("image", b.image.id, ImageObject)
    assert kept.category_id == UNKNOWN_IMAGE_CATEGORY_ID and kept.partition == Partition.UNASSIGNED
