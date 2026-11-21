"""Editing: the annotation commit with its revisions, kinds, and the item
updates applied at once."""

import pytest

from piximi_engine import ReferenceEngine
from piximi_link.errors import BackendError
from piximi_link.peer import HandlerContext
from piximi_schema.classification import AnnotationUpdate
from piximi_schema.editing import (
    AnnotationChanges,
    AnnotationChangeSet,
    AnnotationGeometryChange,
    EntityRef,
    ImageChange,
    VolumeCategoryChange,
    VolumeChanges,
)
from piximi_schema.entities import (
    AnnotationCategory,
    AnnotationObject,
    AnnotationVolume,
    Kind,
    Partition,
    Shape,
)
from piximi_schema.events import KindWithCategory
from piximi_schema.query import AnnotationQuery, ImageQuery, PageRequest
from piximi_schema.segmentation import SegmentationRunRequest
from piximi_schema.unknown import UNKNOWN_KIND_CATEGORY_ID, UNKNOWN_KIND_ID, generate_kind, generate_uuid


def ctx() -> HandlerContext:
    return HandlerContext(None)


async def image_named(engine: ReferenceEngine, name: str):
    page = await engine.images(ImageQuery(), None, PageRequest(limit=100))
    return next(record for record in page.items if record.image.name == name)


async def segmented(engine: ReferenceEngine, name: str, kind_name: str = "Cell"):
    """Image ``name`` with its objects from the threshold model, and the kind."""
    record = await image_named(engine, name)
    await engine.segmentation_run(
        SegmentationRunRequest(model_id="threshold", image_ids=[record.image.id], channel_meta_ids=[], kind_name=kind_name),
        ctx(),
    )
    kind = next(k for k in engine.meta.list("kind", Kind) if k.name == kind_name)
    objects = engine.meta.list("annotation", AnnotationObject, parent=record.image.id)
    volumes = {v.id: v for v in engine.meta.list("volume", AnnotationVolume, parent=record.image.id)}
    return record, kind, objects, volumes


def square(image_id: str, plane_id: str, volume_id: str, x0: int, y0: int, size: int) -> AnnotationObject:
    return AnnotationObject(
        id=generate_uuid(),
        plane_id=plane_id,
        image_id=image_id,
        volume_id=volume_id,
        partition=Partition.UNASSIGNED,
        shape=Shape(planes=1, height=size, width=size, channels=1),
        bounding_box=(x0, y0, x0 + size, y0 + size),
        encoded_mask=[0, size * size],
    )


async def test_commit_round_trip_applies_everything_and_announces(engine: ReferenceEngine):
    record, kind, objects, volumes = await segmented(engine, "a")
    other, _, other_objects, other_volumes = await segmented(engine, "b")
    assert len(objects) >= 2 and all(o.rev is not None for o in objects)
    first, second = objects[0], objects[1]
    doomed = other_objects[0]
    volumes.update(other_volumes)
    round_ = AnnotationCategory(
        type="annotation", id=generate_uuid(), color="#00ff00", name="Round", is_unknown=False, kind_id=kind.id
    )
    await engine.categories_create([round_])
    events = []
    engine.subscribe(events.append)

    new_volume = AnnotationVolume(id=generate_uuid(), image_id=record.image.id, kind_id=kind.id, category_id=round_.id)
    new_object = square(record.image.id, record.image.active_plane_id, new_volume.id, 1, 1, 3)
    x0, y0, x1, y1 = first.bounding_box
    redrawn = AnnotationGeometryChange(
        id=first.id, base_rev=first.rev, bounding_box=(x0, y0, x1, y1 + 1), encoded_mask=[0, (x1 - x0) * (y1 - y0 + 1)]
    )
    result = await engine.annotations_commit(
        AnnotationChangeSet(
            image_ids=[record.image.id, other.image.id],
            volumes=VolumeChanges(
                created=[new_volume],
                updated=[VolumeCategoryChange(id=second.volume_id, base_rev=volumes[second.volume_id].rev, category_id=round_.id)],
                deleted=[EntityRef(id=doomed.volume_id, base_rev=volumes[doomed.volume_id].rev)],
            ),
            annotations=AnnotationChanges(
                created=[new_object],
                updated=[redrawn],
                deleted=[EntityRef(id=doomed.id, base_rev=doomed.rev)],
            ),
        ),
        ctx(),
    )
    assert result.conflicts == []
    assert (result.created, result.updated, result.deleted) == (1, 2, 1)

    # Created: stored with a revision and measured.
    stored = engine.meta.get("annotation", new_object.id, AnnotationObject)
    assert stored.rev is not None and stored.features and stored.features["area"] == 9
    assert stored.intensity_measurements
    added = next(e for e in events if e.type == "annotations/didAdd")
    assert [v.id for v in added.volumes] == [new_volume.id] and added.annotations[0].features["area"] == 9
    # Redrawn: new geometry, higher revision, measured again, partition kept.
    rewritten = engine.meta.get("annotation", first.id, AnnotationObject)
    assert rewritten.bounding_box == (x0, y0, x1, y1 + 1) and rewritten.rev > first.rev
    assert rewritten.shape.height == y1 - y0 + 1 and rewritten.features["area"] == (x1 - x0) * (y1 - y0 + 1)
    assert rewritten.partition == first.partition
    updated = next(e for e in events if e.type == "annotations/didUpdate")
    assert [h.id for h in updated.headers] == [first.id] and updated.headers[0].rev == rewritten.rev
    # Recategorized through the volume, with a fresh revision.
    moved = engine.meta.get("volume", second.volume_id, AnnotationVolume)
    assert moved.category_id == round_.id and moved.rev > volumes[second.volume_id].rev
    assert updated.volumes[0].id == second.volume_id
    assert (await engine.annotation_counts(AnnotationQuery(category_ids=[round_.id]))).total == 2
    # Deleted, with its volume.
    removed = next(e for e in events if e.type == "annotations/didRemove")
    assert removed.annotation_ids == [doomed.id] and removed.volume_ids == [doomed.volume_id]
    assert engine.meta.get("annotation", doomed.id, AnnotationObject) is None
    assert (await engine.annotation_counts(AnnotationQuery(image_ids=[record.image.id]))).total == len(objects) + 1
    assert (await engine.annotation_counts(AnnotationQuery(image_ids=[other.image.id]))).total == len(other_objects) - 1


async def test_commit_refuses_stale_revisions_unless_forced(engine: ReferenceEngine):
    record, kind, objects, volumes = await segmented(engine, "b")
    first = objects[0]
    x0, y0, x1, y1 = first.bounding_box
    stale = AnnotationChangeSet(
        image_ids=[record.image.id],
        annotations=AnnotationChanges(
            updated=[
                AnnotationGeometryChange(
                    id=first.id, base_rev=first.rev - 1, bounding_box=first.bounding_box, encoded_mask=[(x1 - x0) * (y1 - y0)]
                )
            ],
            deleted=[EntityRef(id="nope", base_rev=1)],
        ),
    )
    events = []
    engine.subscribe(events.append)
    result = await engine.annotations_commit(stale, ctx())
    assert (result.created, result.updated, result.deleted) == (0, 0, 0)
    assert {(c.type, c.id, c.reason) for c in result.conflicts} == {
        ("annotation", first.id, "modified"),
        ("annotation", "nope", "missing"),
    }
    assert events == [] and engine.meta.get("annotation", first.id, AnnotationObject).encoded_mask == first.encoded_mask

    forced = await engine.annotations_commit(stale.model_copy(update={"force": True}), ctx())
    assert (forced.created, forced.updated, forced.deleted) == (0, 1, 0)
    assert [(c.id, c.reason) for c in forced.conflicts] == [("nope", "missing")]
    assert engine.meta.get("annotation", first.id, AnnotationObject).encoded_mask == [(x1 - x0) * (y1 - y0)]

    # Without a base revision the check is skipped (a client without one).
    unversioned = AnnotationChangeSet(
        image_ids=[record.image.id],
        annotations=AnnotationChanges(deleted=[EntityRef(id=first.id)]),
    )
    assert (await engine.annotations_commit(unversioned, ctx())).deleted == 1


async def test_commit_validates_what_it_is_given(engine: ReferenceEngine):
    record, kind, objects, _ = await segmented(engine, "a")
    other = await image_named(engine, "d")
    good = square(record.image.id, record.image.active_plane_id, objects[0].volume_id, 0, 0, 2)

    with pytest.raises(BackendError, match="Unknown image"):
        await engine.annotations_commit(AnnotationChangeSet(image_ids=["nope"]), ctx())
    bad_mask = good.model_copy(update={"encoded_mask": [0, 3]})
    with pytest.raises(BackendError, match="does not cover"):
        await engine.annotations_commit(
            AnnotationChangeSet(image_ids=[record.image.id], annotations=AnnotationChanges(created=[bad_mask])), ctx()
        )
    elsewhere = AnnotationVolume(id=generate_uuid(), image_id=other.image.id, kind_id=kind.id, category_id=kind.unknown_category_id)
    with pytest.raises(BackendError, match="not on an image of the session"):
        await engine.annotations_commit(
            AnnotationChangeSet(image_ids=[record.image.id], volumes=VolumeChanges(created=[elsewhere])), ctx()
        )
    wrong_kind = AnnotationVolume(id=generate_uuid(), image_id=record.image.id, kind_id=UNKNOWN_KIND_ID, category_id=kind.unknown_category_id)
    with pytest.raises(BackendError, match="no category of its kind"):
        await engine.annotations_commit(
            AnnotationChangeSet(image_ids=[record.image.id], volumes=VolumeChanges(created=[wrong_kind])), ctx()
        )
    # Nothing of the refused changesets landed.
    assert engine.meta.get("annotation", good.id, AnnotationObject) is None
    assert engine.meta.get("volume", elsewhere.id, AnnotationVolume) is None


async def test_kinds_are_created_renamed_and_deleted_with_their_objects(engine: ReferenceEngine):
    record, cell_kind, objects, _ = await segmented(engine, "a")
    events = []
    engine.subscribe(events.append)

    kind, category = generate_kind("Nucleus")
    assert await engine.kinds_create([KindWithCategory(kind=kind, category=category)]) == [kind]
    assert events[-1].type == "kinds/didAdd" and events[-1].kinds[0].kind.id == kind.id
    assert any(k.id == kind.id for k in (await engine.project()).kinds)
    with pytest.raises(BackendError, match="already exists"):
        await engine.kinds_create([KindWithCategory(kind=kind, category=category)])
    dup, dup_category = generate_kind("Nucleus")
    with pytest.raises(BackendError, match="named 'Nucleus'"):
        await engine.kinds_create([KindWithCategory(kind=dup, category=dup_category)])

    renamed = await engine.kinds_update(kind.id, "Nuclei")
    assert renamed.name == "Nuclei" and events[-1].type == "kinds/didChange"
    assert next(k.name for k in events[-1].kinds if k.id == kind.id) == "Nuclei"
    with pytest.raises(BackendError, match="reserved"):
        await engine.kinds_update(UNKNOWN_KIND_ID, "Other")

    # A classifier of the kind to be deleted, and objects to move.
    from piximi_engine.api import Project
    from piximi_engine.classification.models import LogisticArchitecture

    engine.models.add(LogisticArchitecture())
    project = Project(engine)
    classifier = project.create_classifier("cells", kind="Cell")
    assert classifier.target_id == cell_kind.id
    round_ = AnnotationCategory(
        type="annotation", id=generate_uuid(), color="#00ff00", name="Round", is_unknown=False, kind_id=cell_kind.id
    )
    await engine.categories_create([round_])
    before = engine.meta.get("volume", objects[0].volume_id, AnnotationVolume)

    assert await engine.kinds_delete([cell_kind.id, UNKNOWN_KIND_ID, "nope"]) == 1
    types = [e.type for e in events]
    assert types[-1] == "kinds/didRemove" and events[-1].kind_ids == [cell_kind.id]
    assert "annotations/didUpdate" in types and "categories/didChange" in types and "classifiers/didChange" in types
    moved = engine.meta.get("volume", objects[0].volume_id, AnnotationVolume)
    assert (moved.kind_id, moved.category_id) == (UNKNOWN_KIND_ID, UNKNOWN_KIND_CATEGORY_ID)
    assert moved.rev > before.rev
    summary = await engine.project()
    assert all(k.id != cell_kind.id for k in summary.kinds)
    assert all(getattr(c, "kind_id", None) != cell_kind.id for c in summary.categories)
    assert all(c.id != classifier.id for c in await engine.classification_list())
    assert (await engine.annotation_counts(AnnotationQuery(kind_ids=[UNKNOWN_KIND_ID]))).total == len(objects)


async def test_images_annotations_and_project_updates(engine: ReferenceEngine):
    record, kind, objects, _ = await segmented(engine, "b")
    events = []
    engine.subscribe(events.append)

    [image] = await engine.images_update([ImageChange(id=record.image.id, name="renamed", partition=Partition.TRAINING)])
    assert (image.name, image.partition) == ("renamed", Partition.TRAINING)
    assert events[-1].type == "images/didChange" and events[-1].images[0].name == "renamed"
    assert (await engine.image_counts(ImageQuery(partitions=[Partition.TRAINING]))).total == 1
    with pytest.raises(BackendError, match="not a plane"):
        await engine.images_update([ImageChange(id=record.image.id, active_plane_id="nope")])
    with pytest.raises(BackendError, match="Unknown image"):
        await engine.images_update([ImageChange(id="nope", name="x")])
    # No change, no event.
    count = len(events)
    await engine.images_update([ImageChange(id=record.image.id, name="renamed")])
    assert len(events) == count

    first = objects[0]
    assert await engine.annotations_update([AnnotationUpdate(id=first.id, partition=Partition.VALIDATION)]) == 1
    assert events[-1].type == "annotations/didUpdate" and events[-1].annotations[0].partition == Partition.VALIDATION
    assert (await engine.annotation_counts(AnnotationQuery(partitions=[Partition.VALIDATION]))).total == 1
    assert engine.meta.get("annotation", first.id, AnnotationObject).rev == first.rev  # partitions do not move it
    assert await engine.annotations_update([AnnotationUpdate(id=first.id, partition=Partition.VALIDATION)]) == 0

    experiment = await engine.project_update("Renamed project")
    assert experiment.name == "Renamed project" and events[-1].type == "project/didChange"
    assert (await engine.project()).experiment.name == "Renamed project"
    with pytest.raises(BackendError):
        await engine.project_update("   ")
