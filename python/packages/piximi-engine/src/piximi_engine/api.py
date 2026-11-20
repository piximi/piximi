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
from piximi_schema.entities import AnnotationObject, AnnotationVolume, Channel, ImageObject, Kind
from piximi_schema.segmentation import (
    ModelDescriptor,
    SegmentationRunRequest,
    SegmentationRunSummary,
)

from .decode import SUPPORTED_SUFFIXES
from .engine import ReferenceEngine
from .rle import decode_mask


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
