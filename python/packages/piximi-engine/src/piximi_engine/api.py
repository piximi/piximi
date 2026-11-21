"""The engine as a Python object, for notebooks and scripts.

Everything goes through the same engine the frontend talks to, so an image
added here appears in every connected tab, and objects segmented in a tab
are readable here.
"""

from __future__ import annotations

import asyncio
from collections.abc import Iterable
from pathlib import Path
from typing import Any

import numpy as np

from piximi_link.peer import HandlerContext
from piximi_schema.classification import (
    IMAGE_TARGET_ID,
    Classifier,
    ClassifierCreateRequest,
    ClassifierFitRequest,
    ClassifierFitSummary,
    ClassifierHyperparameters,
    ClassifierPredictRequest,
    ClassifierPredictSummary,
    CropOptions,
    CropSchema,
    LossFunction,
    Metric,
    NormalizeOptions,
    OptimizationAlgorithm,
    OptimizerSettings,
    PreprocessSettings,
)
from piximi_schema.editing import (
    AnnotationChanges,
    AnnotationChangeSet,
    AnnotationGeometryChange,
    CommitResult,
    EntityRef,
    VolumeChanges,
)
from piximi_schema.entities import (
    AnnotationObject,
    AnnotationVolume,
    BBox,
    Channel,
    Experiment,
    ImageObject,
    Kind,
    Partition,
    Plane,
    Shape,
)
from piximi_schema.events import KindWithCategory
from piximi_schema.unknown import generate_kind, generate_uuid
from piximi_schema.segmentation import (
    ModelDescriptor,
    SegmentationRunRequest,
    SegmentationRunSummary,
)

from .decode import SUPPORTED_SUFFIXES
from .engine import ReferenceEngine
from .rle import decode_mask, encode_mask


class CommitConflictError(RuntimeError):
    """A commit was refused because something it touched changed meanwhile."""

    def __init__(self, result: CommitResult) -> None:
        super().__init__(
            "Refused: "
            + ", ".join(f"{conflict.type} {conflict.id} {conflict.reason}" for conflict in result.conflicts)
        )
        self.result = result


def _crop(mask: np.ndarray, bbox: BBox | None) -> tuple[BBox, np.ndarray]:
    """A boolean mask as the engine stores it: the box it covers and the
    mask cropped to it. A full-image mask is boxed by its foreground."""
    mask = np.asarray(mask).astype(bool)
    if bbox is None:
        rows, cols = np.nonzero(mask)
        if rows.size == 0:
            raise ValueError("The mask has no foreground")
        bbox = (int(cols.min()), int(rows.min()), int(cols.max()) + 1, int(rows.max()) + 1)
        x0, y0, x1, y1 = bbox
        return bbox, mask[y0:y1, x0:x1]
    x0, y0, x1, y1 = bbox
    if mask.shape != (y1 - y0, x1 - x0):
        raise ValueError(f"The mask is {mask.shape}, not the {y1 - y0}x{x1 - x0} of its box")
    return bbox, mask


class Project:
    def __init__(self, engine: ReferenceEngine) -> None:
        self.engine = engine

    # ── Images ───────────────────────────────────────────────────────────────

    def add_images(self, *paths: str | Path) -> list[str]:
        """Imports files, or every supported file in folders; returns the new
        image ids. Connected tabs see the images at once."""
        added: list[str] = []
        for path in paths:
            path = Path(path)
            if path.is_dir():
                added.extend(self.engine.ingest_folder(path))
            elif path.suffix.lower() in SUPPORTED_SUFFIXES:
                added.extend(self.engine.ingest_file(path))
            else:
                raise ValueError(f"Not a supported image or folder: {path}")
        return added

    @property
    def images(self) -> list[ImageObject]:
        return self.engine.meta.list("image", ImageObject)

    def image(self, name_or_id: str) -> ImageObject:
        for image in self.images:
            if name_or_id in (image.id, image.name):
                return image
        raise KeyError(f"No image {name_or_id!r}")

    def channels(self, image: str | ImageObject) -> list[Channel]:
        """The active plane's channels, in channel order."""
        image = self.image(image) if isinstance(image, str) else image
        return self.engine.meta.list("channel", Channel, parent=image.active_plane_id)

    def pixels(self, image: str | ImageObject) -> np.ndarray:
        """The active plane as a ``(C, Y, X)`` array."""
        return np.stack([self.engine.pixels.get(channel.id) for channel in self.channels(image)])

    # ── Objects ──────────────────────────────────────────────────────────────

    @property
    def kinds(self) -> list[Kind]:
        return self.engine.meta.list("kind", Kind)

    def annotations(self, image: str | ImageObject | None = None) -> list[AnnotationObject]:
        if image is None:
            return self.engine.meta.list("annotation", AnnotationObject)
        image = self.image(image) if isinstance(image, str) else image
        return self.engine.meta.list("annotation", AnnotationObject, parent=image.id)

    def labels(self, image: str | ImageObject, kind: str | None = None) -> np.ndarray:
        """The image's objects as a label image (0 = background), optionally
        only those of one kind (by name)."""
        image = self.image(image) if isinstance(image, str) else image
        wanted_kind = None
        if kind is not None:
            wanted_kind = next((k.id for k in self.kinds if k.name == kind), None)
            if wanted_kind is None:
                raise KeyError(f"No kind {kind!r}")
        volumes = {v.id: v for v in self.engine.meta.list("volume", AnnotationVolume, parent=image.id)}
        labels = np.zeros((image.shape.height, image.shape.width), dtype=np.int32)
        label = 0
        for annotation in self.annotations(image):
            volume = volumes.get(annotation.volume_id)
            if volume is None or (wanted_kind is not None and volume.kind_id != wanted_kind):
                continue
            x0, y0, x1, y1 = annotation.bounding_box
            mask = decode_mask(annotation.encoded_mask, (y1 - y0, x1 - x0))
            label += 1
            region = labels[y0:y1, x0:x1]
            region[mask & (region == 0)] = label
        return labels

    def kind(self, name_or_id: str) -> Kind:
        for kind in self.kinds:
            if name_or_id in (kind.id, kind.name):
                return kind
        raise KeyError(f"No kind {name_or_id!r}")

    def annotation(self, id: str) -> AnnotationObject:
        annotation = self.engine.meta.get("annotation", id, AnnotationObject)
        if annotation is None:
            raise KeyError(f"No annotation {id!r}")
        return annotation

    # ── Editing ──────────────────────────────────────────────────────────────
    #
    # Edits go through the same commit the annotator uses, so connected tabs
    # see them, and an object changed in a tab meanwhile is reported as a
    # conflict (``CommitConflictError``) rather than overwritten, unless
    # ``force`` is given.

    async def _commit(self, changeset: AnnotationChangeSet) -> CommitResult:
        result = await self.engine.annotations_commit(changeset, HandlerContext(None))
        if result.conflicts and not changeset.force:
            raise CommitConflictError(result)
        return result

    async def create_kind(self, name: str) -> Kind:
        kind, category = generate_kind(name)
        [created] = await self.engine.kinds_create([KindWithCategory(kind=kind, category=category)])
        return created

    async def rename_kind(self, kind: str | Kind, name: str) -> Kind:
        record = self.kind(kind) if isinstance(kind, str) else kind
        return await self.engine.kinds_update(record.id, name)

    async def delete_kind(self, kind: str | Kind) -> int:
        """Removes the kind with its categories and classifiers; its objects
        return to the unknown kind."""
        record = self.kind(kind) if isinstance(kind, str) else kind
        return await self.engine.kinds_delete([record.id])

    async def add_annotation(
        self,
        image: str | ImageObject,
        mask: np.ndarray,
        *,
        kind: str | Kind = "Unknown",
        category: str | None = None,
        bbox: BBox | None = None,
        plane: int = 0,
    ) -> AnnotationObject:
        """Adds an object from a boolean mask (the whole image, or the box
        ``bbox`` covers), of a kind (by name) and optionally one of its
        categories (by name); returns it measured."""
        record = self.image(image) if isinstance(image, str) else image
        kind_record = self.kind(kind) if isinstance(kind, str) else kind
        category_id = kind_record.unknown_category_id
        if category is not None:
            categories = [
                c
                for c in self.engine._categories()
                if c.type == "annotation" and c.kind_id == kind_record.id and c.name == category
            ]
            if not categories:
                raise KeyError(f"Kind {kind_record.name!r} has no category {category!r}")
            category_id = categories[0].id
        planes = sorted(self.engine.meta.list("plane", Plane, parent=record.id), key=lambda p: p.z_index)
        plane_id = planes[plane].id
        box, cropped = _crop(mask, bbox)
        x0, y0, x1, y1 = box
        volume = AnnotationVolume(
            id=generate_uuid(), image_id=record.id, kind_id=kind_record.id, category_id=category_id
        )
        annotation = AnnotationObject(
            id=generate_uuid(),
            plane_id=plane_id,
            image_id=record.id,
            volume_id=volume.id,
            partition=Partition.UNASSIGNED,
            shape=Shape(planes=1, height=y1 - y0, width=x1 - x0, channels=record.shape.channels),
            bounding_box=box,
            encoded_mask=encode_mask(cropped),
        )
        await self._commit(
            AnnotationChangeSet(
                image_ids=[record.id],
                volumes=VolumeChanges(created=[volume]),
                annotations=AnnotationChanges(created=[annotation]),
            )
        )
        return self.annotation(annotation.id)

    async def set_mask(
        self,
        annotation: str | AnnotationObject,
        mask: np.ndarray,
        *,
        bbox: BBox | None = None,
        force: bool = False,
    ) -> AnnotationObject:
        """Redraws an object; refused if it changed since it was read."""
        record = self.annotation(annotation) if isinstance(annotation, str) else annotation
        box, cropped = _crop(mask, bbox)
        await self._commit(
            AnnotationChangeSet(
                image_ids=[record.image_id],
                annotations=AnnotationChanges(
                    updated=[
                        AnnotationGeometryChange(
                            id=record.id, base_rev=record.rev, bounding_box=box, encoded_mask=encode_mask(cropped)
                        )
                    ]
                ),
                force=force,
            )
        )
        return self.annotation(record.id)

    async def delete_annotations(self, annotations: Iterable[str | AnnotationObject], *, force: bool = False) -> int:
        records = [self.annotation(a) if isinstance(a, str) else a for a in annotations]
        if not records:
            return 0
        result = await self._commit(
            AnnotationChangeSet(
                image_ids=sorted({record.image_id for record in records}),
                annotations=AnnotationChanges(deleted=[EntityRef(id=r.id, base_rev=r.rev) for r in records]),
                force=force,
            )
        )
        return result.deleted

    async def rename(self, name: str) -> Experiment:
        return await self.engine.project_update(name)

    # ── Models ───────────────────────────────────────────────────────────────

    @property
    def models(self) -> dict[str, ModelDescriptor]:
        """Every model by id, with its status."""
        return {descriptor.name: descriptor for descriptor in self.engine.models.describe_all()}

    def register_model(self, path: str | Path) -> list[str]:
        """Registers a plugin (a folder with a ``piximi-model.toml``) and
        returns its model ids; connected tabs list it at once. Registering
        the same plugin again replaces it, so a plugin can be edited and
        re-registered from the notebook."""
        return self.engine.models.register(Path(path))

    async def segment(
        self,
        model: str = "threshold",
        images: Iterable[str | ImageObject] | None = None,
        *,
        channels: Iterable[int] | None = None,
        kind: str | None = None,
        **options: Any,
    ) -> SegmentationRunSummary:
        """Runs a model over images (all by default), optionally on a subset of
        channel indices, labelling the objects with ``kind``. Progress and the
        results reach every connected tab; await it in a notebook cell."""
        image_ids = [
            (self.image(image) if isinstance(image, str) else image).id
            for image in (images if images is not None else self.images)
        ]
        request = SegmentationRunRequest(
            model_id=model,
            image_ids=image_ids,
            channel_meta_ids=[f"channel-meta-{index}" for index in channels] if channels else [],
            options=options or None,
            kind_name=kind,
        )
        return await self.engine.segmentation_run(request, HandlerContext(None))

    def segment_sync(self, *args: Any, **kwargs: Any) -> SegmentationRunSummary:
        """`segment` for a plain script, where no event loop is running."""
        return asyncio.run(self.segment(*args, **kwargs))

    # ── Classifiers ──────────────────────────────────────────────────────────

    @property
    def classifiers(self) -> list[Classifier]:
        return self.engine.classification.list()

    def classifier(self, name_or_id: str) -> Classifier:
        for classifier in self.classifiers:
            if name_or_id in (classifier.id, classifier.name):
                return classifier
        raise KeyError(f"No classifier {name_or_id!r}")

    def create_classifier(
        self,
        name: str,
        *,
        architecture: str = "logistic",
        kind: str | None = None,
        input_shape: tuple[int, int, int] = (1, 28, 28),
        epochs: int = 10,
        batch_size: int = 32,
        learning_rate: float = 0.01,
        training_percentage: float = 0.8,
        seed: int | None = None,
    ) -> Classifier:
        """A classifier for the project's images, or for a kind's objects
        (by kind name), with ``input_shape`` as ``(channels, height, width)``."""
        target_id = IMAGE_TARGET_ID
        if kind is not None:
            target_id = next((k.id for k in self.kinds if k.name == kind), None) or kind
        channels, height, width = input_shape
        hyperparameters = ClassifierHyperparameters(
            preprocess=PreprocessSettings(
                shuffle=True,
                input_shape=Shape(planes=1, height=height, width=width, channels=channels),
                normalize_options=NormalizeOptions(normalize=True, center=False),
                crop_options=CropOptions(num_crops=1, crop_schema=CropSchema.NONE),
                training_percentage=training_percentage,
            ),
            optimizer=OptimizerSettings(
                learning_rate=learning_rate,
                loss_function=LossFunction.CATEGORICAL_CROSS_ENTROPY,
                metrics=[Metric.CATEGORICAL_ACCURACY],
                optimization_algorithm=OptimizationAlgorithm.ADAM,
                epochs=epochs,
                batch_size=batch_size,
            ),
        )
        return self.engine.classification.create(
            ClassifierCreateRequest(
                target_id=target_id, name=name, architecture_id=architecture, hyperparameters=hyperparameters, seed=seed
            )
        )

    async def fit(self, classifier: str | Classifier, *, seed: int | None = None) -> ClassifierFitSummary:
        """Trains on the target's labeled items; connected tabs follow the
        epochs. Await it in a notebook cell."""
        record = self.classifier(classifier) if isinstance(classifier, str) else classifier
        return await self.engine.classification_fit(
            ClassifierFitRequest(classifier_id=record.id, seed=seed), HandlerContext(None)
        )

    async def predict(self, classifier: str | Classifier) -> ClassifierPredictSummary:
        """Labels the target's unlabeled items; accept or clear them after."""
        record = self.classifier(classifier) if isinstance(classifier, str) else classifier
        return await self.engine.classification_predict(
            ClassifierPredictRequest(classifier_id=record.id), HandlerContext(None)
        )

    async def accept_predictions(self, kind: str | None = None) -> int:
        target_id = IMAGE_TARGET_ID if kind is None else next(k.id for k in self.kinds if k.name == kind)
        return (await self.engine.classification_accept_predictions(target_id)).changed

    async def clear_predictions(self, kind: str | None = None) -> int:
        target_id = IMAGE_TARGET_ID if kind is None else next(k.id for k in self.kinds if k.name == kind)
        return (await self.engine.classification_clear_predictions(target_id)).changed
