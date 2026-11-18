"""What a segmentation model looks like to the engine.

A model declares itself as data (its policies and option schema, the same
shapes the frontend renders) and turns a ``(C, Y, X)`` image into detections.
This is the in-process form; the plugin form that runs each model in its own
environment arrives later and plugs in behind the same shape.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

import numpy as np
from scipy import ndimage

from piximi_link.peer import HandlerContext
from piximi_schema.segmentation import (
    ChannelPolicy,
    ModelLink,
    ModelResources,
    ModelStatus,
    ModelTask,
    OptionSchema,
    OutputPolicy,
    SegmentationModelDescriptor,
)

BBox = tuple[int, int, int, int]


@dataclass
class Detection:
    bbox: BBox
    """``[x1, y1, x2, y2]``, exclusive upper bounds, in plane coordinates."""
    mask: np.ndarray
    """Boolean, cropped to ``bbox``."""
    kind_name: str


class SegmentationModel(ABC):
    id: str
    display_name: str
    description: str = ""
    use: str = ""
    sources: list[ModelLink] = []
    cite: list[ModelLink] | None = None
    cloud_warning: str | None = None
    framework: str = "python"
    version: str | None = None
    resources: ModelResources | None = None
    output_policy: OutputPolicy
    channel_policy: ChannelPolicy
    option_schema: OptionSchema | None = None
    cancellable_load: bool = False

    @property
    @abstractmethod
    def loaded(self) -> bool: ...

    @property
    def status(self) -> ModelStatus:
        """In-process models need no environment: ready until loaded."""
        return ModelStatus.LOADED if self.loaded else ModelStatus.READY

    @property
    def status_message(self) -> str | None:
        return None

    async def unload(self) -> None:
        """Frees what ``load`` claimed; a no-op for models that hold nothing."""

    async def load(self, ctx: HandlerContext) -> None:
        """Fetches weights and warms up; a no-op for models with nothing to load."""

    @abstractmethod
    def segment(
        self,
        image: np.ndarray,
        options: dict[str, Any],
        kind_name: str,
        ctx: HandlerContext,
    ) -> list[Detection]:
        """Synchronous and CPU/GPU heavy; the engine runs it off the loop."""

    def describe(self) -> SegmentationModelDescriptor:
        return SegmentationModelDescriptor(
            name=self.id,
            display_name=self.display_name,
            model_loaded=self.loaded,
            status=self.status,
            status_message=self.status_message,
            framework=self.framework,
            version=self.version,
            tasks=[ModelTask.SEGMENTATION],
            resources=self.resources,
            output_policy=self.output_policy,
            channel_policy=self.channel_policy,
            option_schema=self.option_schema,
            cancellable_load=self.cancellable_load,
            description=self.description,
            use=self.use,
            sources=self.sources,
            cite=self.cite,
            cloud_warning=self.cloud_warning,
        )


def apply_option_defaults(schema: OptionSchema | None, options: dict[str, Any]) -> dict[str, Any]:
    """The options a run should see: the schema's declared defaults, then the
    caller's values on top. The frontend fills defaults before sending, but a
    caller from Python need not."""
    resolved: dict[str, Any] = {}
    for group in schema.groups if schema else []:
        for field in group.fields:
            default = getattr(field, "default", None)
            if default is not None:
                resolved[field.key] = default
    resolved.update({key: value for key, value in options.items() if value is not None})
    return resolved


def labels_to_detections(labels: np.ndarray, kind_name: str, min_area: int = 1) -> list[Detection]:
    """Splits a label image (0 = background) into one detection per label."""
    detections: list[Detection] = []
    for index, bounds in enumerate(ndimage.find_objects(labels), start=1):
        if bounds is None:
            continue
        rows, cols = bounds
        mask = labels[rows, cols] == index
        if int(mask.sum()) < min_area:
            continue
        detections.append(
            Detection(
                bbox=(cols.start, rows.start, cols.stop, rows.stop),
                mask=mask,
                kind_name=kind_name,
            )
        )
    return detections
