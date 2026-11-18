"""The reference engine: metadata in SQLite, pixels in zarr, models in
process. Implements ``piximi_link.engine.Engine``."""

from __future__ import annotations

import asyncio
import logging
from collections import defaultdict
from collections.abc import Callable
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
from piximi_schema.events import AnnotationsDidAdd, ImagesDidAdd, KindsDidAdd, KindWithCategory
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
    SegmentationModelDescriptor,
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
)

from .decode import SUPPORTED_SUFFIXES, read_image
from .dedup import MaskedBox, is_duplicate
from .jobs import JobRegistry
from .measure import intensity_measurements, object_features
from .models import SegmentationModel, default_models
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
        models: dict[str, SegmentationModel] | None = None,
        gpu: bool = True,
    ) -> None:
        self.data_dir = Path(data_dir)
        self.meta = MetaStore(self.data_dir / "meta.sqlite")
        self.pixels = PixelStore(self.data_dir / "pixels.zarr")
        self._models = models if models is not None else default_models(gpu=gpu)
        self._listeners: list[EventListener] = []
        self.jobs = JobRegistry(self._emit)
        self._ensure_project()

    # ── Engine protocol: session ────────────────────────────────────────────

    def capabilities(self) -> list[Capability]:
        return [Capability.SEGMENTATION, Capability.EVENTS_PUSH]

    def subscribe(self, listener: EventListener) -> Callable[[], None]:
        self._listeners.append(listener)

        def unsubscribe() -> None:
            if listener in self._listeners:
                self._listeners.remove(listener)

        return unsubscribe

    async def close(self) -> None:
        self.meta.close()

    def _emit(self, event: BackendEvent) -> None:
        for listener in list(self._listeners):
            try:
                listener(event)
            except Exception:
                log.exception("event listener failed")

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

    def ingest_file(self, path: Path) -> list[str]:
        decoded = read_image(path)
        height, width = decoded.shape
        max_intensity = 2**decoded.bit_depth - 1
        dtype = "uint8" if decoded.bit_depth == 8 else "uint16"

        experiment = self.experiment
        if experiment.channels is None:
            experiment = experiment.model_copy(update={"channels": decoded.channels})
            self.meta.put("experiment", _ExperimentRow(id="experiment", experiment=experiment))
        metas = {meta.id: meta for meta in self.meta.list("channel_meta", ChannelMeta)}
        new_metas: list[ChannelMeta] = []
        for index in range(decoded.channels):
            meta_id = f"channel-meta-{index}"
            if meta_id not in metas:
                new_metas.append(
                    ChannelMeta(
                        id=meta_id,
                        name=f"Channel {index}",
                        bit_depth=decoded.bit_depth,
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

    async def images(self, query: ImageQuery, sort: ImageSort | None, page: PageRequest) -> ImagePage:
        where = image_clauses(query)
        joins, order = image_order(sort)
        ids = self.meta.select_ids(
            "image", where=where, joins=joins, order=order, offset=page.offset, limit=page.limit
        )
        return ImagePage(items=self._image_records(ids), total=self.meta.count("image", where=where))

    async def image_ids(self, query: ImageQuery, sort: ImageSort | None) -> list[str]:
        joins, order = image_order(sort)
        return self.meta.select_ids("image", where=image_clauses(query), joins=joins, order=order)

    async def image_counts(self, query: ImageQuery, group_by: ImageCountGroup | None) -> CountsResult:
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
        where = annotation_clauses(query)
        joins, order = annotation_order(sort)
        ids = self.meta.select_ids(
            "annotation", where=where, joins=joins, order=order, offset=page.offset, limit=page.limit
        )
        return AnnotationPage(
            items=self._annotation_records(ids), total=self.meta.count("annotation", where=where)
        )

    async def annotation_ids(self, query: AnnotationQuery, sort: AnnotationSort | None) -> list[str]:
        joins, order = annotation_order(sort)
        return self.meta.select_ids("annotation", where=annotation_clauses(query), joins=joins, order=order)

    async def annotation_counts(
        self, query: AnnotationQuery, group_by: AnnotationCountGroup | None
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

    # ── Engine protocol: segmentation ───────────────────────────────────────

    def _model(self, model_id: str) -> SegmentationModel:
        model = self._models.get(model_id)
        if model is None:
            raise BackendError("MODEL_NOT_FOUND", f'No model "{model_id}"')
        return model

    async def segmentation_list_models(self) -> list[SegmentationModelDescriptor]:
        return [model.describe() for model in self._models.values()]

    async def segmentation_load_model(self, model_id: str, ctx: HandlerContext) -> None:
        model = self._model(model_id)
        if model.loaded:
            return
        job = self.jobs.start(
            JobKind.MODEL_LOAD, f"Loading {model.display_name}", cancellable=model.cancellable_load
        )

        def progress(value: Any) -> None:
            ctx.progress(value)
            if isinstance(value, dict):
                self.jobs.update(job.id, progress=value.get("percent", -1), message=value.get("message"))

        try:
            await model.load(ctx.with_progress(progress))
        except RequestCancelled:
            self.jobs.finish(job.id, JobStatus.CANCELLED)
            raise
        except Exception as error:
            self.jobs.finish(job.id, JobStatus.FAILED, error=str(error))
            raise
        self.jobs.finish(job.id, JobStatus.SUCCEEDED, message="Model loaded")

    async def segmentation_run(
        self, request: SegmentationRunRequest, ctx: HandlerContext
    ) -> SegmentationRunSummary:
        model = self._model(request.model_id)
        job = self.jobs.start(JobKind.SEGMENTATION, "Beginning segmentation")
        try:
            summary = await self._run(job, model, request, ctx)
        except RequestCancelled:
            self.jobs.finish(job.id, JobStatus.CANCELLED)
            raise
        except Exception as error:
            self.jobs.finish(job.id, JobStatus.FAILED, error=str(error))
            raise
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

            detections = await asyncio.to_thread(model.segment, stack, options, kind_name, ctx)

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
