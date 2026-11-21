"""Measurement tables from the store: columns by key over a scope, paged
and filtered, agreeing with the entities they summarise."""

import pytest
from piximi_engine import ReferenceEngine
from piximi_link.errors import BackendError
from piximi_link.peer import HandlerContext
from piximi_schema.capabilities import Capability
from piximi_schema.entities import (
    AnnotationObject,
    AnnotationVolume,
    IntensityMeasurement,
    ObjectFeature,
    Partition,
    Shape,
)
from piximi_schema.measurements import (
    MeasurementScope,
    MeasurementTableRequest,
    TablePageRequest,
    feature_column,
    intensity_column,
    parse_column,
)
from piximi_schema.query import AnnotationQuery, ImageQuery, PageRequest
from piximi_schema.segmentation import SegmentationRunRequest
from piximi_schema.unknown import generate_uuid

from piximi_engine.store import annotation_index

AREA = feature_column("area")
MEAN_0 = intensity_column("mean", "channel-meta-0")
MEDIAN_0 = intensity_column("median", "channel-meta-0")
MEAN_9 = intensity_column("mean", "channel-meta-9")


def test_column_keys_round_trip():
    assert parse_column(AREA) == ("feature", ObjectFeature.AREA)
    assert parse_column(MEAN_0) == ("intensity", IntensityMeasurement.MEAN, "channel-meta-0")
    for bad in ("feature:volume", "intensity:mean", "intensity:mode:channel-meta-0", "bogus"):
        with pytest.raises(ValueError):
            parse_column(bad)


def objects(kind_id: str, **rest) -> MeasurementTableRequest:
    return MeasurementTableRequest(scope=MeasurementScope(type="objects", kind_id=kind_id), **rest)


def images(**rest) -> MeasurementTableRequest:
    return MeasurementTableRequest(scope=MeasurementScope(type="images"), **rest)


async def segmented(engine: ReferenceEngine) -> str:
    """Runs the threshold model over ``a`` and ``b``; returns the kind id."""
    page = await engine.images(ImageQuery(), None, PageRequest(limit=10))
    by_name = {record.image.name: record.image for record in page.items}
    await engine.segmentation_run(
        SegmentationRunRequest(
            model_id="threshold", image_ids=[by_name["a"].id, by_name["b"].id], channel_meta_ids=[], kind_name="Cell"
        ),
        HandlerContext(None),
    )
    return next(kind.id for kind in (await engine.project()).kinds if kind.name == "Cell")


async def channel_of(engine: ReferenceEngine, image_id: str, plane_id: str, meta_id: str):
    record = engine._image_record(image_id)
    return next(c for c in record.channels if c.plane_id == plane_id and c.channel_meta_id == meta_id)


async def test_objects_table_agrees_with_the_entities(engine: ReferenceEngine):
    assert Capability.MEASUREMENTS in engine.capabilities()
    kind_id = await segmented(engine)
    listed = await engine.annotations(AnnotationQuery(kind_ids=[kind_id]), None, PageRequest(limit=100))
    table = await engine.measurement_table(objects(kind_id, columns=[AREA, MEAN_0, MEAN_9]))
    assert table.total == listed.total == len(table.ids) == 4
    assert set(table.image_names) == {"a", "b"}
    by_id = {record.annotation.id: record for record in listed.items}
    for i, id in enumerate(table.ids):
        annotation, volume = by_id[id].annotation, by_id[id].volume
        assert table.image_ids[i] == annotation.image_id
        assert table.category_ids[i] == volume.category_id
        assert table.partitions[i] == annotation.partition
        assert table.bounding_boxes[i] == annotation.bounding_box
        assert table.timepoints[i] == 0
        assert table.values[AREA][i] == annotation.features["area"]
        channel = await channel_of(engine, annotation.image_id, annotation.plane_id, "channel-meta-0")
        assert table.values[MEAN_0][i] == annotation.intensity_measurements[channel.id]["mean"]
    # A meta no plane has is a column of nothing, not an error.
    assert table.values[MEAN_9] == [None] * 4


async def test_objects_table_pages_and_filters(engine: ReferenceEngine):
    kind_id = await segmented(engine)
    whole = await engine.measurement_table(objects(kind_id, columns=[AREA]))
    window = await engine.measurement_table(objects(kind_id, columns=[AREA], page=TablePageRequest(offset=1, limit=2)))
    assert window.total == whole.total and window.ids == whole.ids[1:3]
    assert window.values[AREA] == whole.values[AREA][1:3]
    assert window.bounding_boxes == whole.bounding_boxes[1:3]

    a = whole.image_ids[0]
    on_a = await engine.measurement_table(objects(kind_id, columns=[AREA], annotation_query=AnnotationQuery(image_ids=[a])))
    assert on_a.total == len(on_a.ids) == 2 and set(on_a.image_ids) == {a}
    # The query cannot reach outside the scope's kind.
    other = await engine.measurement_table(
        objects(kind_id, columns=[AREA], annotation_query=AnnotationQuery(kind_ids=["some-other-kind"]))
    )
    assert other.total == 0 and other.ids == [] and other.values == {AREA: []}


async def test_unmeasured_objects_table_as_nothing(engine: ReferenceEngine):
    kind_id = await segmented(engine)
    image = (await engine.images(ImageQuery(), None, PageRequest(limit=1))).items[0]
    volume = AnnotationVolume(id=generate_uuid(), image_id=image.image.id, kind_id=kind_id, category_id="unknown")
    bare = AnnotationObject(
        id=generate_uuid(),
        plane_id=image.planes[0].id,
        image_id=image.image.id,
        volume_id=volume.id,
        partition=Partition.UNASSIGNED,
        shape=Shape(planes=1, height=2, width=2, channels=1),
        bounding_box=(0, 0, 2, 2),
        encoded_mask=[0, 4],
    )
    engine.meta.put("volume", volume, parent=image.image.id)
    engine.meta.put("annotation", bare, parent=image.image.id, index=annotation_index(volume))
    table = await engine.measurement_table(objects(kind_id, columns=[AREA, MEAN_0]))
    position = table.ids.index(bare.id)
    assert table.values[AREA][position] is None and table.values[MEAN_0][position] is None
    assert all(value is not None for i, value in enumerate(table.values[AREA]) if i != position)


async def test_images_table_reads_the_active_plane(engine: ReferenceEngine):
    table = await engine.measurement_table(images(columns=[MEAN_0, MEDIAN_0, MEAN_9]))
    listed = (await engine.images(ImageQuery(), None, PageRequest(limit=100))).items
    assert table.total == len(listed) == len(table.ids)
    assert table.ids == [record.image.id for record in listed]
    assert table.image_ids is None and table.bounding_boxes is None
    for i, record in enumerate(listed):
        assert table.image_names[i] == record.image.name
        assert table.category_ids[i] == record.image.category_id
        assert table.partitions[i] == record.image.partition
        channel = next(
            c for c in record.channels if c.plane_id == record.image.active_plane_id and c.channel_meta_id == "channel-meta-0"
        )
        # Ingest fills every statistic now, not only the mean.
        assert channel.median is not None and channel.std is not None and channel.mad is not None
        assert table.values[MEAN_0][i] == channel.mean and table.values[MEDIAN_0][i] == channel.median
        assert table.values[MEAN_9][i] is None
    only = await engine.measurement_table(images(columns=[MEAN_0], image_query=ImageQuery(ids=[listed[2].image.id])))
    assert only.ids == [listed[2].image.id] and only.total == 1


async def test_table_refuses_what_it_cannot_measure(engine: ReferenceEngine):
    for request in (
        images(columns=["bogus"]),
        images(columns=[AREA]),
        MeasurementTableRequest(scope=MeasurementScope(type="objects"), columns=[AREA]),
    ):
        with pytest.raises(BackendError) as info:
            await engine.measurement_table(request)
        assert info.value.code == "NOT_SUPPORTED"
