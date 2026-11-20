"""The reference engine: metadata in SQLite, pixels in zarr, models in
process. Implements ``piximi_link.engine.Engine``."""

from __future__ import annotations

import asyncio
import logging
import threading
from collections import defaultdict
from datetime import UTC, datetime
from collections.abc import Callable, Iterable
from pathlib import Path
from typing import Any

import numpy as np

from piximi_link.engine import BackendEvent, EventListener
from piximi_link.errors import BackendError, RequestCancelled
from piximi_link.peer import HandlerContext
from piximi_schema.capabilities import Capability
from piximi_schema.entities import (
    AnnotationCategory,
    AnnotationHeader,
    AnnotationObject,
    AnnotationVolume,
    Category,
    Channel,
    ChannelMeta,
    Experiment,
    ImageObject,
    ImageSeries,
    Kind,
    Partition,
    Plane,
    Shape,
)
from piximi_schema.classification import (
    AnnotationUpdate,
    ChangedResult,
    Classifier,
    ClassifierCreateRequest,
    ClassifierExportResult,
    ClassifierFitRequest,
    ClassifierFitSummary,
    ClassifierImportRequest,
    ClassifierPredictRequest,
    ClassifierPredictSummary,
    ClassifierUpdateRequest,
    EvaluationResult,
    ImageUpdate,
    VolumeUpdate,
)
from piximi_schema.events import (
    AnnotationsDidAdd,
    AnnotationsDidRemove,
    AnnotationsDidUpdate,
    CategoriesDidChange,
    ImagesDidAdd,
    ImagesDidRemove,
    ImagesDidUpdate,
    KindsDidAdd,
    KindWithCategory,
    ModelsDidChange,
)
from piximi_schema.jobs import Job, JobKind, JobStatus
from piximi_schema.methods import RenderThumbnailsResult
from piximi_schema.query import (
    AnnotationCountGroup,
    AnnotationHeader,
    AnnotationPage,
    AnnotationQuery,
    AnnotationRecord,
    AnnotationSort,
    CountsResult,
    ImageCountGroup,
    ImagePage,
    ImageQuery,
    ImageRecord,
    ImageSort,
    PageRequest,
    ProjectCounts,
    ProjectSummary,
)
from piximi_schema.render import (
    RenderedImage,
    RenderRequest,
    ThumbnailFailed,
    ThumbnailRendered,
    ThumbnailsPartial,
)
from piximi_schema.errors import BackendErrorData
from piximi_schema.rpc import ProgressValue
from piximi_schema.segmentation import (
    ModelDescriptor,
    SegmentationRunRequest,
    SegmentationRunSummary,
)
from piximi_schema.unknown import (
    UNKNOWN_IMAGE_CATEGORY,
    UNKNOWN_IMAGE_CATEGORY_ID,
    UNKNOWN_KIND,
    UNKNOWN_KIND_CATEGORY,
    generate_kind,
    generate_uuid,
    represents_unknown,
)

from .classification import next_partition, prediction_correction
from .classification.service import ClassificationService

from .decode import SUPPORTED_SUFFIXES, read_image
from .dedup import MaskedBox, is_duplicate
from .jobs import JobRegistry
from .measure import intensity_measurements, object_features
from .models import ModelRegistry, SegmentationModel, default_registry
from .models.base import apply_option_defaults
from .query import (
    ANNOTATION_COUNT_COLUMNS,
    IMAGE_COUNT_COLUMNS,
    annotation_clauses,
    annotation_order,
    image_clauses,
    image_order,
)
from .render import composite, encode_png
from .rle import encode_mask
from .store import MetaStore, PixelStore, annotation_index

log = logging.getLogger(__name__)

# One colour per channel index, as the frontend assigns them on import.
DEFAULT_COLORS = [
    (1.0, 0.0, 0.0),
    (0.0, 1.0, 0.0),
    (0.0, 0.0, 1.0),
    (1.0, 1.0, 0.0),
    (0.0, 1.0, 1.0),
    (1.0, 0.0, 1.0),
    (1.0, 1.0, 1.0),
]

THUMBNAIL_BATCH = 8



class ReferenceEngine:
    name = "piximi-engine"
    version = "0.1.0"

    def __init__(
        self,
        data_dir: Path | str,
        *,
        models: dict[str, SegmentationModel] | ModelRegistry | None = None,
        models_dirs: Iterable[Path | str] = (),
        gpu: bool = True,
    ) -> None:
        self.data_dir = Path(data_dir)
        self.meta = MetaStore(self.data_dir / "meta.sqlite")
        self.pixels = PixelStore(self.data_dir / "pixels.zarr")
        if isinstance(models, ModelRegistry):
            self.models = models
        elif models is None:
            self.models = default_registry(gpu=gpu, models_dirs=models_dirs)
        else:
            self.models = ModelRegistry(gpu=gpu)
            for model in models.values():
                self.models.add(model)
        self.models.on_change = self._models_changed
        self._models = self.models.models
        """The registry's mapping, shared: a test may swap a model in."""
        self._listeners: list[EventListener] = []
        self._loop: asyncio.AbstractEventLoop | None = None
        self._loop_thread: int | None = None
        self._run_contexts: dict[str, HandlerContext] = {}
        self.jobs = JobRegistry(self._emit)
        self.classification = ClassificationService(self)
        self._ensure_project()

    # ── Engine protocol: session ────────────────────────────────────────────

    def capabilities(self) -> list[Capability]:
        capabilities = [Capability.SEGMENTATION, Capability.EVENTS_PUSH]
        if self.models.classifiers:
            capabilities += [Capability.CLASSIFICATION, Capability.CLASSIFICATION_TRAIN]
        return capabilities

    def subscribe(self, listener: EventListener) -> Callable[[], None]:
        self._listeners.append(listener)

        def unsubscribe() -> None:
            if listener in self._listeners:
                self._listeners.remove(listener)

        return unsubscribe

    async def close(self) -> None:
        await self.models.close()
        self.meta.close()

    def _emit(self, event: BackendEvent) -> None:
        for listener in list(self._listeners):
            try:
                listener(event)
            except Exception:
                log.exception("event listener failed")

    def _capture_loop(self) -> None:
        """Remembers the loop the engine serves on, so that changes made
        from worker threads (an environment build) reach listeners there."""
        self._loop = asyncio.get_running_loop()
        self._loop_thread = threading.get_ident()

    def _models_changed(self) -> None:
        def emit() -> None:
            self._emit(ModelsDidChange(type="models/didChange", models=self.models.describe_all()))

        if self._loop is not None and threading.get_ident() != self._loop_thread and not self._loop.is_closed():
            self._loop.call_soon_threadsafe(emit)
        else:
            emit()

    # ── Project setup and ingest ────────────────────────────────────────────

    def _ensure_project(self) -> None:
        if self.meta.get("experiment", "experiment", _ExperimentRow) is None:
            name = self.data_dir.parent.name or "Project"
            self.meta.put("experiment", _ExperimentRow(id="experiment", experiment=Experiment(id=generate_uuid(), name=name)))
        if self.meta.get("kind", UNKNOWN_KIND.id, Kind) is None:
            self.meta.put("kind", UNKNOWN_KIND)
            self.meta.put("category", UNKNOWN_IMAGE_CATEGORY)
            self.meta.put("category", UNKNOWN_KIND_CATEGORY)

    @property
    def experiment(self) -> Experiment:
        return self.meta.get("experiment", "experiment", _ExperimentRow).experiment  # type: ignore[union-attr]

    def ingest_folder(self, folder: Path | str) -> list[str]:
        """Imports every supported file not yet imported; returns new image ids."""
        added: list[str] = []
        for path in sorted(Path(folder).iterdir()):
            if path.suffix.lower() not in SUPPORTED_SUFFIXES or not path.is_file():
                continue
            if self.meta.source_image_ids(str(path.resolve())) is not None:
                continue
            try:
                added.extend(self.ingest_file(path))
            except Exception as error:
                log.warning("skipping %s: %s", path.name, error)
        return added

    def ensure_channels(self, count: int) -> Experiment:
        """Fixes the project's channel count on the first import."""
        experiment = self.experiment
        if experiment.channels is None:
            experiment = experiment.model_copy(update={"channels": count})
            self.meta.put("experiment", _ExperimentRow(id="experiment", experiment=experiment))
        return experiment

    def ensure_channel_metas(self, count: int, bit_depth: int, max_intensity: float) -> list[ChannelMeta]:
        """Creates the display settings for channel indices that have none
        yet (``channel-meta-<index>``); returns only the new ones."""
        metas = {meta.id for meta in self.meta.list("channel_meta", ChannelMeta)}
        new_metas: list[ChannelMeta] = []
        for index in range(count):
            meta_id = f"channel-meta-{index}"
            if meta_id not in metas:
                new_metas.append(
                    ChannelMeta(
                        id=meta_id,
                        name=f"Channel {index}",
                        bit_depth=bit_depth,
                        color_map=DEFAULT_COLORS[index % len(DEFAULT_COLORS)],
                        visible=True,
                        min_value=0,
                        max_value=max_intensity,
                        ramp_min=0,
                        ramp_max=max_intensity,
                        ramp_min_limit=0,
                        ramp_max_limit=max_intensity,
                    )
                )
        self.meta.put_many("channel_meta", [(meta, None) for meta in new_metas])
        return new_metas

    def ingest_file(self, path: Path) -> list[str]:
        decoded = read_image(path)
        height, width = decoded.shape
        max_intensity = 2**decoded.bit_depth - 1
        dtype = "uint8" if decoded.bit_depth == 8 else "uint16"

        experiment = self.ensure_channels(decoded.channels)
        new_metas = self.ensure_channel_metas(decoded.channels, decoded.bit_depth, max_intensity)

        series_id, image_id = generate_uuid(), generate_uuid()
        shape = Shape(planes=len(decoded.planes), height=height, width=width, channels=decoded.channels)
        planes = [Plane(id=generate_uuid(), image_id=image_id, z_index=z) for z in range(len(decoded.planes))]
        image = ImageObject(
            id=image_id,
            name=path.stem,
            series_id=series_id,
            shape=shape,
            category_id=UNKNOWN_IMAGE_CATEGORY_ID,
            active_plane_id=planes[0].id,
            timepoint=0,
            bit_depth=decoded.bit_depth,
            partition=Partition.UNASSIGNED,
        )
        series = ImageSeries(
            id=series_id,
            experiment_id=experiment.id,
            name=path.stem,
            bit_depth=decoded.bit_depth,
            shape=shape,
            time_series=False,
            active_image_id=image_id,
        )
        channels: list[tuple[Channel, str]] = []
        for plane, pixels in zip(planes, decoded.planes):
            for index in range(decoded.channels):
                data = pixels[index]
                channel = Channel(
                    id=generate_uuid(),
                    plane_id=plane.id,
                    channel_meta_id=f"channel-meta-{index}",
                    name=f"Channel {index}",
                    dtype=dtype,
                    bit_depth=decoded.bit_depth,
                    width=width,
                    height=height,
                    max_value=float(data.max()),
                    min_value=float(data.min()),
                    mean=float(data.mean()),
                )
                self.pixels.put(channel.id, data)
                channels.append((channel, plane.id))

        self.meta.put("series", series)
        self.meta.put("image", image, parent=series_id)
        self.meta.put_many("plane", [(plane, image_id) for plane in planes])
        self.meta.put_many("channel", channels)
        self.meta.record_source(str(path.resolve()), [image_id])
        self._emit(
            ImagesDidAdd(
                type="images/didAdd",
                records=[self._image_record(image_id)],
                channel_metas=new_metas,
            )
        )
        return [image_id]

    # ── Engine protocol: query ──────────────────────────────────────────────

    async def project(self) -> ProjectSummary:
        return ProjectSummary(
            experiment=self.experiment,
            kinds=self.meta.list("kind", Kind),
            categories=self._categories(),
            channel_metas=self.meta.list("channel_meta", ChannelMeta),
            counts=ProjectCounts(images=self.meta.count("image"), annotations=self.meta.count("annotation")),
        )

    def _categories(self) -> list[Category]:
        from pydantic import TypeAdapter  # noqa: PLC0415

        adapter = TypeAdapter(Category)
        return [adapter.validate_python(c) for c in (row.to_wire() for row in self.meta.list("category", _AnyCategory))]

    def _check_sort(self, sort: ImageSort | AnnotationSort | None) -> None:
        """The softmax order exists only where predictions can be made."""
        if sort is not None and sort.key == "softmax" and Capability.CLASSIFICATION not in self.capabilities():
            raise BackendError("NOT_SUPPORTED", "This backend holds no classifier predictions to sort by")

    async def images(self, query: ImageQuery, sort: ImageSort | None, page: PageRequest) -> ImagePage:
        self._check_sort(sort)
        where = image_clauses(query)
        joins, order = image_order(sort)
        ids = self.meta.select_ids(
            "image", where=where, joins=joins, order=order, offset=page.offset, limit=page.limit
        )
        return ImagePage(items=self._image_records(ids), total=self.meta.count("image", where=where))

    async def image_ids(self, query: ImageQuery, sort: ImageSort | None = None) -> list[str]:
        self._check_sort(sort)
        joins, order = image_order(sort)
        return self.meta.select_ids("image", where=image_clauses(query), joins=joins, order=order)

    async def image_counts(self, query: ImageQuery, group_by: ImageCountGroup | None = None) -> CountsResult:
        where = image_clauses(query)
        return CountsResult(
            total=self.meta.count("image", where=where),
            groups=None
            if group_by is None
            else self.meta.count_by("image", IMAGE_COUNT_COLUMNS[group_by], where=where),
        )

    def _image_record(self, image_id: str) -> ImageRecord:
        records = self._image_records([image_id])
        if not records:
            raise BackendError("NOT_FOUND", f"Unknown image {image_id}")
        return records[0]

    def _image_records(self, ids: list[str]) -> list[ImageRecord]:
        """Records for ``ids`` in that order, fetched a kind at a time rather
        than per image; ids with no image are left out."""
        images = self.meta.get_many("image", ids, ImageObject)
        series = self.meta.get_many(
            "series", sorted({image.series_id for image in images.values()}), ImageSeries
        )
        planes_by_image: dict[str, list[Plane]] = defaultdict(list)
        for plane in self.meta.list("plane", Plane, parents=ids):
            planes_by_image[plane.image_id].append(plane)
        channels_by_plane: dict[str, list[Channel]] = defaultdict(list)
        plane_ids = [plane.id for planes in planes_by_image.values() for plane in planes]
        for channel in self.meta.list("channel", Channel, parents=plane_ids):
            channels_by_plane[channel.plane_id].append(channel)
        records = []
        for id in ids:
            image = images.get(id)
            if image is None:
                continue
            image_series = series.get(image.series_id)
            if image_series is None:
                raise BackendError("NOT_FOUND", f"Image {id} has no series")
            planes = planes_by_image.get(id, [])
            records.append(
                ImageRecord(
                    image=image,
                    series=image_series,
                    planes=planes,
                    channels=[channel for plane in planes for channel in channels_by_plane.get(plane.id, [])],
                )
            )
        return records

    async def annotations(
        self, query: AnnotationQuery, sort: AnnotationSort | None, page: PageRequest
    ) -> AnnotationPage:
        self._check_sort(sort)
        where = annotation_clauses(query)
        joins, order = annotation_order(sort)
        ids = self.meta.select_ids(
            "annotation", where=where, joins=joins, order=order, offset=page.offset, limit=page.limit
        )
        return AnnotationPage(
            items=self._annotation_records(ids), total=self.meta.count("annotation", where=where)
        )

    async def annotation_ids(self, query: AnnotationQuery, sort: AnnotationSort | None = None) -> list[str]:
        self._check_sort(sort)
        joins, order = annotation_order(sort)
        return self.meta.select_ids("annotation", where=annotation_clauses(query), joins=joins, order=order)

    async def annotation_counts(
        self, query: AnnotationQuery, group_by: AnnotationCountGroup | None = None
    ) -> CountsResult:
        where = annotation_clauses(query)
        return CountsResult(
            total=self.meta.count("annotation", where=where),
            groups=None
            if group_by is None
            else self.meta.count_by("annotation", ANNOTATION_COUNT_COLUMNS[group_by], where=where),
        )

    def _annotation_records(self, ids: list[str]) -> list[AnnotationRecord]:
        headers = self.meta.get_many("annotation", ids, AnnotationHeader)
        volumes = self.meta.get_many(
            "volume", sorted({header.volume_id for header in headers.values()}), AnnotationVolume
        )
        records = []
        for id in ids:
            header = headers.get(id)
            volume = volumes.get(header.volume_id) if header else None
            if header is None or volume is None:
                continue
            records.append(AnnotationRecord(volume=volume, annotation=header))
        return records

    async def masks(self, annotation_ids: list[str]) -> dict[str, list[int]]:
        found = self.meta.get_many("annotation", annotation_ids, AnnotationObject)
        return {id: annotation.encoded_mask for id, annotation in found.items()}

    # ── Engine protocol: mutations ──────────────────────────────────────────

    async def images_delete(self, query: ImageQuery) -> int:
        ids = self.meta.select_ids("image", where=image_clauses(query))
        if not ids:
            return 0
        images = self.meta.get_many("image", ids, ImageObject)
        planes = self.meta.list("plane", Plane, parents=ids)
        plane_ids = [plane.id for plane in planes]
        channels = self.meta.list("channel", Channel, parents=plane_ids)
        for channel in channels:
            self.pixels.delete(channel.id)
        self.meta.delete("channel", [channel.id for channel in channels])
        self.meta.delete("plane", plane_ids)
        self.meta.delete("annotation", self.meta.ids("annotation", parents=ids))
        self.meta.delete("volume", self.meta.ids("volume", parents=ids))
        self.meta.delete("image", ids)
        # A series is its images; one left without any goes too.
        for series_id in sorted({image.series_id for image in images.values()}):
            if not self.meta.ids("image", parents=[series_id]):
                self.meta.delete("series", [series_id])
        self._emit(ImagesDidRemove(type="images/didRemove", image_ids=ids))
        return len(ids)

    async def annotations_delete(self, query: AnnotationQuery) -> int:
        ids = self.meta.select_ids("annotation", where=annotation_clauses(query))
        if not ids:
            return 0
        headers = self.meta.get_many("annotation", ids, AnnotationHeader)
        self.meta.delete("annotation", ids)
        # A volume is its annotations across planes; one left empty goes too.
        candidates = sorted({header.volume_id for header in headers.values()})
        image_ids = sorted({header.image_id for header in headers.values()})
        still_used = {
            header.volume_id
            for header in self.meta.list("annotation", AnnotationHeader, parents=image_ids)
        }
        empty = [volume_id for volume_id in candidates if volume_id not in still_used]
        self.meta.delete("volume", empty)
        self._emit(
            AnnotationsDidRemove(type="annotations/didRemove", annotation_ids=ids, volume_ids=empty)
        )
        return len(ids)

    # ── Engine protocol: categories ─────────────────────────────────────────

    def _category(self, category_id: str) -> Category:
        row = self.meta.get("category", category_id, _AnyCategory)
        if row is None:
            raise BackendError("NOT_FOUND", f"Unknown category {category_id}")
        from pydantic import TypeAdapter  # noqa: PLC0415

        return TypeAdapter(Category).validate_python(row.to_wire())

    def _categories_changed(self) -> None:
        self._emit(CategoriesDidChange(type="categories/didChange", categories=self._categories()))

    async def categories_create(self, categories: list[Category]) -> list[Category]:
        kinds = {kind.id for kind in self.meta.list("kind", Kind)}
        for category in categories:
            if self.meta.get("category", category.id, _AnyCategory) is not None:
                raise BackendError("NOT_SUPPORTED", f"A category {category.id} already exists")
            if category.type == "annotation" and category.kind_id not in kinds:
                raise BackendError("NOT_FOUND", f"Unknown kind {category.kind_id}")
        if categories:
            self.meta.put_many("category", [(category, None) for category in categories])
            self._categories_changed()
        return categories

    async def categories_update(self, id: str, name: str | None, color: str | None) -> Category:
        category = self._category(id)
        changes = {key: value for key, value in (("name", name), ("color", color)) if value is not None}
        if changes:
            category = category.model_copy(update=changes)
            self.meta.put("category", category)
            self._categories_changed()
        return category

    async def categories_delete(self, ids: list[str]) -> int:
        """Items return to the unknown category; their partitions and
        prediction records stay, as the frontend's own cascade leaves them."""
        gone: list[Category] = []
        for id in ids:
            if represents_unknown(id):
                continue
            row = self.meta.get("category", id, _AnyCategory)
            if row is not None:
                gone.append(self._category(id))
        if not gone:
            return 0
        image_categories = [c.id for c in gone if c.type == "image"]
        annotation_categories = [c for c in gone if c.type == "annotation"]

        image_updates: list[ImageUpdate] = []
        if image_categories:
            ids_ = self.meta.select_ids("image", where=[MetaStore.in_clause("category_id", image_categories)])
            images = self.meta.get_many("image", ids_, ImageObject)
            rows = []
            for image in images.values():
                updated = image.model_copy(update={"category_id": UNKNOWN_IMAGE_CATEGORY_ID})
                rows.append((updated, updated.series_id))
                image_updates.append(_image_update(updated))
            self.meta.put_many("image", rows)

        volume_updates: list[VolumeUpdate] = []
        if annotation_categories:
            unknown_of = {kind.id: kind.unknown_category_id for kind in self.meta.list("kind", Kind)}
            volume_ids = self.meta.select_ids(
                "volume", where=[MetaStore.in_clause("category_id", [c.id for c in annotation_categories])]
            )
            volumes = self.meta.get_many("volume", volume_ids, AnnotationVolume)
            rows = []
            for volume in volumes.values():
                updated = volume.model_copy(update={"category_id": unknown_of[volume.kind_id]})
                rows.append((updated, updated.image_id))
                volume_updates.append(_volume_update(updated))
            self.meta.put_many("volume", rows)
            self._reindex_annotations({volume.id: volume for volume, _ in rows})

        self.meta.delete("category", [c.id for c in gone])
        if image_updates:
            self._emit(ImagesDidUpdate(type="images/didUpdate", updates=image_updates))
        if volume_updates:
            self._emit(AnnotationsDidUpdate(type="annotations/didUpdate", volumes=volume_updates, annotations=[]))
        self._categories_changed()
        return len(gone)

    def _reindex_annotations(
        self, volumes: dict[str, AnnotationVolume], partitions: dict[str, Partition] | None = None
    ) -> list[AnnotationUpdate]:
        """Rewrites the annotations of ``volumes`` so their indexed columns
        follow the volume again, with new partitions where given; returns
        the partition of every annotation whose volume moved, so a client
        can apply them without knowing the rule."""
        image_ids = sorted({volume.image_id for volume in volumes.values()})
        headers = [
            header
            for header in self.meta.list("annotation", AnnotationHeader, parents=image_ids)
            if header.volume_id in volumes
        ]
        updates: list[AnnotationUpdate] = []
        rewritten: list[AnnotationHeader] = []
        for header in headers:
            if partitions is not None:
                partition = partitions.get(header.id, header.partition)
                if partition != header.partition:
                    header = header.model_copy(update={"partition": partition})
                updates.append(AnnotationUpdate(id=header.id, partition=partition))
            rewritten.append(header)
        self.meta.update_many(
            "annotation", rewritten, index={h.id: annotation_index(volumes[h.volume_id]) for h in rewritten}
        )
        return updates

    async def images_categorize(self, query: ImageQuery, category_id: str) -> int:
        category = self._category(category_id)
        if category.type != "image":
            raise BackendError("NOT_FOUND", f"{category_id} is not an image category")
        ids = self.meta.select_ids("image", where=image_clauses(query))
        images = self.meta.get_many("image", ids, ImageObject)
        now = _now()
        rows = []
        updates: list[ImageUpdate] = []
        for id in ids:
            image = images.get(id)
            if image is None or image.category_id == category_id:
                continue
            updated = image.model_copy(
                update={
                    "category_id": category_id,
                    "partition": next_partition(category_id, image.partition, False),
                    "prediction_confidence": None,
                    "predicted_at_run_id": None,
                    "prediction_corrected": prediction_correction(
                        image.category_id,
                        category_id,
                        image.predicted_at_run_id,
                        image.prediction_confidence,
                        image.prediction_corrected,
                        now,
                    ),
                }
            )
            rows.append((updated, updated.series_id))
            updates.append(_image_update(updated))
        if rows:
            self.meta.put_many("image", rows)
            self._emit(ImagesDidUpdate(type="images/didUpdate", updates=updates))
        return len(updates)

    async def annotations_categorize(self, query: AnnotationQuery, category_id: str) -> int:
        category = self._category(category_id)
        if category.type != "annotation":
            raise BackendError("NOT_FOUND", f"{category_id} is not an object category")
        ids = self.meta.select_ids("annotation", where=annotation_clauses(query))
        headers = self.meta.get_many("annotation", ids, AnnotationHeader)
        volumes = self.meta.get_many(
            "volume", sorted({header.volume_id for header in headers.values()}), AnnotationVolume
        )
        now = _now()
        changed: dict[str, AnnotationVolume] = {}
        for volume in volumes.values():
            if volume.category_id == category_id:
                continue
            changed[volume.id] = volume.model_copy(
                update={
                    "kind_id": category.kind_id,
                    "category_id": category_id,
                    "prediction_confidence": None,
                    "predicted_at_run_id": None,
                    "prediction_corrected": prediction_correction(
                        volume.category_id,
                        category_id,
                        volume.predicted_at_run_id,
                        volume.prediction_confidence,
                        volume.prediction_corrected,
                        now,
                    ),
                }
            )
        if not changed:
            return 0
        self.meta.put_many("volume", [(volume, volume.image_id) for volume in changed.values()])
        # Every annotation of a moved volume follows the partition rule.
        image_ids = sorted({volume.image_id for volume in changed.values()})
        partitions = {
            header.id: next_partition(category_id, header.partition, False)
            for header in self.meta.list("annotation", AnnotationHeader, parents=image_ids)
            if header.volume_id in changed
        }
        annotation_updates = self._reindex_annotations(changed, partitions)
        self._emit(
            AnnotationsDidUpdate(
                type="annotations/didUpdate",
                volumes=[_volume_update(volume) for volume in changed.values()],
                annotations=annotation_updates,
            )
        )
        return sum(1 for header in headers.values() if header.volume_id in changed)

    # ── Engine protocol: classification ─────────────────────────────────────
    #
    # The service owns the records and jobs; these are the wire's names for it.

    async def classification_list_architectures(self) -> list[ModelDescriptor]:
        return self.classification.list_architectures()

    async def classification_list(self) -> list[Classifier]:
        return self.classification.list()

    async def classification_create(self, request: ClassifierCreateRequest) -> Classifier:
        return self.classification.create(request)

    async def classification_update(self, request: ClassifierUpdateRequest) -> Classifier:
        return self.classification.update(request)

    async def classification_delete(self, classifier_id: str) -> None:
        self.classification.delete(classifier_id)

    async def classification_fit(self, request: ClassifierFitRequest, ctx: HandlerContext) -> ClassifierFitSummary:
        return await self.classification.fit(request, ctx)

    async def classification_predict(
        self, request: ClassifierPredictRequest, ctx: HandlerContext
    ) -> ClassifierPredictSummary:
        return await self.classification.predict(request, ctx)

    async def classification_evaluate(self, classifier_id: str) -> EvaluationResult:
        return await self.classification.evaluate(classifier_id)

    async def classification_accept_predictions(self, target_id: str) -> ChangedResult:
        return await self.classification.accept_predictions(target_id)

    async def classification_clear_predictions(self, target_id: str) -> ChangedResult:
        return await self.classification.clear_predictions(target_id)

    async def classification_export(self, classifier_id: str) -> ClassifierExportResult:
        return self.classification.export(classifier_id)

    async def classification_import(self, request: ClassifierImportRequest) -> Classifier:
        return self.classification.import_(request)

    # What the service announces about items it changed.
    _image_update = staticmethod(lambda image: _image_update(image))
    _volume_update = staticmethod(lambda volume: _volume_update(volume))

    # ── Engine protocol: render ─────────────────────────────────────────────

    def _layers(self, request: RenderRequest) -> list[tuple[np.ndarray, int, tuple[float, float, float], float, float]]:
        layers = []
        for display in request.channels:
            if not display.visible:
                continue
            channel = self.meta.get("channel", display.channel_id, Channel)
            if channel is None:
                raise BackendError("NOT_FOUND", f"Unknown channel {display.channel_id}")
            layers.append(
                (
                    self.pixels.get(channel.id),
                    int(channel.bit_depth),
                    display.color_map,
                    display.ramp_min,
                    display.ramp_max,
                )
            )
        if not layers:
            raise BackendError("NOT_FOUND", "No visible channels to render")
        return layers

    async def _render(self, request: RenderRequest) -> RenderedImage:
        # Metadata lookups stay on the loop thread (the SQLite connection is
        # bound to it); the pixel work goes to a worker thread.
        layers = self._layers(request)

        def draw() -> RenderedImage:
            rgb = composite(layers, request.region)
            return RenderedImage(
                width=rgb.shape[1], height=rgb.shape[0], mime="image/png", data=encode_png(rgb)
            )

        return await asyncio.to_thread(draw)

    async def render_image(self, request: RenderRequest) -> RenderedImage:
        return await self._render(request)

    async def render_thumbnails(
        self, requests: list[RenderRequest], ctx: HandlerContext
    ) -> RenderThumbnailsResult:
        rendered = failed = 0
        batch: list[ThumbnailRendered | ThumbnailFailed] = []

        def flush() -> None:
            if batch:
                ctx.progress(ThumbnailsPartial(results=list(batch)).to_wire())
                batch.clear()

        for index, request in enumerate(requests):
            if ctx.cancelled:
                break
            try:
                image = await self._render(request)
                batch.append(ThumbnailRendered(index=index, status="rendered", image=image))
                rendered += 1
            except BackendError as error:
                batch.append(
                    ThumbnailFailed(
                        index=index,
                        status="failed",
                        error=BackendErrorData(code=error.code, message=error.message),
                    )
                )
                failed += 1
            if len(batch) >= THUMBNAIL_BATCH:
                flush()
        flush()
        return RenderThumbnailsResult(rendered=rendered, failed=failed)

    # ── Engine protocol: jobs ───────────────────────────────────────────────

    async def jobs_list(self) -> list[Job]:
        return self.jobs.list()

    async def jobs_cancel(self, job_id: str) -> None:
        self.jobs.cancel(job_id)
        # Reaches a model mid-image, not only the loop between images.
        context = self._run_contexts.get(job_id)
        if context is not None:
            context.cancel()

    # ── Engine protocol: segmentation ───────────────────────────────────────

    def _model(self, model_id: str) -> SegmentationModel:
        model = self._models.get(model_id)
        if model is None:
            raise BackendError("MODEL_NOT_FOUND", f'No model "{model_id}"')
        return model

    async def segmentation_list_models(self) -> list[ModelDescriptor]:
        return self.models.describe_all()

    async def segmentation_load_model(self, model_id: str, ctx: HandlerContext) -> None:
        self._capture_loop()
        model = self._model(model_id)
        if model.loaded:
            return
        job = self.jobs.start(
            JobKind.MODEL_LOAD, f"Loading {model.display_name}", cancellable=model.cancellable_load
        )
        self._run_contexts[job.id] = ctx

        def progress(value: Any) -> None:
            ctx.progress(value)
            if isinstance(value, dict):
                self.jobs.update(job.id, progress=value.get("percent", -1), message=value.get("message"))

        try:
            await self.models.load(model, ctx.with_progress(progress))
        except RequestCancelled:
            self.jobs.finish(job.id, JobStatus.CANCELLED)
            raise
        except Exception as error:
            self.jobs.finish(job.id, JobStatus.FAILED, error=str(error))
            raise
        finally:
            self._run_contexts.pop(job.id, None)
        self.jobs.finish(job.id, JobStatus.SUCCEEDED, message="Model loaded")

    async def segmentation_run(
        self, request: SegmentationRunRequest, ctx: HandlerContext
    ) -> SegmentationRunSummary:
        self._capture_loop()
        model = self._model(request.model_id)
        job = self.jobs.start(JobKind.SEGMENTATION, "Beginning segmentation")
        self._run_contexts[job.id] = ctx
        try:
            summary = await self._run(job, model, request, ctx)
        except RequestCancelled:
            self.jobs.finish(job.id, JobStatus.CANCELLED)
            raise
        except Exception as error:
            self.jobs.finish(job.id, JobStatus.FAILED, error=str(error))
            raise
        finally:
            self._run_contexts.pop(job.id, None)
        message = f"Segmentation finished: {summary.added} added"
        if summary.skipped:
            message += f", {summary.skipped} skipped as duplicates"
        self.jobs.finish(
            job.id, JobStatus.CANCELLED if summary.cancelled else JobStatus.SUCCEEDED, message=message
        )
        return summary

    async def _run(
        self,
        job: Job,
        model: SegmentationModel,
        request: SegmentationRunRequest,
        ctx: HandlerContext,
    ) -> SegmentationRunSummary:
        def progress(percent: float, message: str) -> None:
            ctx.progress(ProgressValue(percent=percent, message=message).to_wire())
            self.jobs.update(job.id, progress=percent, message=message)

        def cancelled() -> bool:
            return ctx.cancelled or self.jobs.is_cancelling(job.id)

        def summary(added: int, skipped: int, was_cancelled: bool) -> SegmentationRunSummary:
            return SegmentationRunSummary(job_id=job.id, added=added, skipped=skipped, cancelled=was_cancelled)

        if cancelled():
            return summary(0, 0, True)
        if not model.loaded:
            await self.segmentation_load_model(request.model_id, ctx)

        images: list[ImageObject] = []
        for image_id in request.image_ids:
            image = self.meta.get("image", image_id, ImageObject)
            if image is None:
                raise BackendError("NOT_FOUND", f"Unknown image {image_id}")
            images.append(image)
        if not images:
            raise BackendError("NOT_FOUND", "There are no images to segment")

        default_kind = (
            model.output_policy.default_kind_name if model.output_policy.mode == "single" else "Object"
        )
        kind_name = request.kind_name or default_kind
        options = apply_option_defaults(model.option_schema, dict(request.options or {}))
        kinds_by_name = {kind.name: kind for kind in self.meta.list("kind", Kind)}
        new_kinds: list[KindWithCategory] = []
        volumes: list[AnnotationVolume] = []
        annotations: list[AnnotationObject] = []
        skipped = 0
        was_cancelled = False

        for index, image in enumerate(images):
            if cancelled():
                was_cancelled = True
                break
            progress(round(index / len(images) * 100), f"Segmenting {image.name} ({index + 1}/{len(images)})")

            plane_id = image.active_plane_id
            channels = self.meta.list("channel", Channel, parent=plane_id)
            if request.channel_meta_ids:
                by_meta = {channel.channel_meta_id: channel for channel in channels}
                selected = [by_meta[meta_id] for meta_id in request.channel_meta_ids if meta_id in by_meta]
            else:
                selected = channels
            if not selected:
                raise BackendError("NOT_FOUND", f"Image {image.name} has none of the requested channels")
            stack = np.stack([self.pixels.get(channel.id) for channel in selected])

            try:
                detections = await asyncio.to_thread(model.segment, stack, options, kind_name, ctx)
            except RequestCancelled:
                # The model noticed mid-image; keep what earlier images added.
                was_cancelled = True
                break

            # Snapshot the plane's existing objects per kind, for the IoU check.
            existing: dict[str, list[MaskedBox]] = defaultdict(list)
            volumes_by_id = {
                volume.id: volume for volume in self.meta.list("volume", AnnotationVolume, parent=image.id)
            }
            for existing_annotation in self.meta.list("annotation", AnnotationObject, parent=image.id):
                if existing_annotation.plane_id != plane_id:
                    continue
                volume = volumes_by_id.get(existing_annotation.volume_id)
                if volume is not None:
                    existing[volume.kind_id].append(
                        MaskedBox(existing_annotation.bounding_box, runs=existing_annotation.encoded_mask)
                    )

            for detection in detections:
                kind = kinds_by_name.get(detection.kind_name)
                if kind is None:
                    kind, category = generate_kind(detection.kind_name)
                    kinds_by_name[kind.name] = kind
                    new_kinds.append(KindWithCategory(kind=kind, category=category))
                candidate = MaskedBox(detection.bbox, mask=detection.mask)
                if is_duplicate(candidate, existing[kind.id]):
                    skipped += 1
                    continue
                existing[kind.id].append(candidate)

                x0, y0, x1, y1 = detection.bbox
                volume = AnnotationVolume(
                    id=generate_uuid(), image_id=image.id, kind_id=kind.id, category_id=kind.unknown_category_id
                )
                intensities = {}
                for channel in channels:
                    measured = intensity_measurements(
                        detection.mask, self.pixels.get(channel.id, detection.bbox)
                    )
                    if measured is not None:
                        intensities[channel.id] = measured
                annotation = AnnotationObject(
                    id=generate_uuid(),
                    plane_id=plane_id,
                    image_id=image.id,
                    volume_id=volume.id,
                    partition=Partition.UNASSIGNED,
                    shape=Shape(planes=1, height=y1 - y0, width=x1 - x0, channels=image.shape.channels),
                    bounding_box=detection.bbox,
                    encoded_mask=encode_mask(detection.mask),
                    features=object_features(detection.mask) or None,
                    intensity_measurements=intensities or None,
                )
                volumes.append(volume)
                annotations.append(annotation)

        if new_kinds:
            self.meta.put_many("kind", [(entry.kind, None) for entry in new_kinds])
            self.meta.put_many("category", [(entry.category, None) for entry in new_kinds])
            self._emit(KindsDidAdd(type="kinds/didAdd", kinds=new_kinds))
        if annotations:
            self.meta.put_many("volume", [(volume, volume.image_id) for volume in volumes])
            by_volume = {volume.id: volume for volume in volumes}
            self.meta.put_many(
                "annotation",
                [(annotation, annotation.image_id) for annotation in annotations],
                index={a.id: annotation_index(by_volume[a.volume_id]) for a in annotations},
            )
            self._emit(AnnotationsDidAdd(type="annotations/didAdd", volumes=volumes, annotations=annotations))
        if not was_cancelled:
            progress(100, f"Segmentation finished: {len(annotations)} added")
        return summary(len(annotations), skipped, was_cancelled)


def _now() -> str:
    return datetime.now(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def _image_update(image: ImageObject) -> ImageUpdate:
    return ImageUpdate(
        id=image.id,
        category_id=image.category_id,
        partition=image.partition,
        prediction_confidence=image.prediction_confidence,
        predicted_at_run_id=image.predicted_at_run_id,
        prediction_corrected=image.prediction_corrected,
    )


def _volume_update(volume: AnnotationVolume) -> VolumeUpdate:
    return VolumeUpdate(
        id=volume.id,
        kind_id=volume.kind_id,
        category_id=volume.category_id,
        prediction_confidence=volume.prediction_confidence,
        predicted_at_run_id=volume.predicted_at_run_id,
        prediction_corrected=volume.prediction_corrected,
    )


# ── Storage rows that are not wire models themselves ─────────────────────────

from piximi_schema.base import WireModel  # noqa: E402


class _ExperimentRow(WireModel):
    id: str
    experiment: Experiment


class _AnyCategory(WireModel):
    """Reads a category row without knowing its variant; `_categories`
    re-validates through the discriminated union."""

    model_config = {**WireModel.model_config, "extra": "allow"}
    id: str
