"""StarDist2D through cellcast (https://github.com/uw-loci/cellcast): the
model recast in Rust/Burn on a WebGPU backend, so it runs on the GPU on
macOS too, and on the CPU where there is no adapter. Registered only when
the optional ``cellcast`` package is present.
"""

from __future__ import annotations

import asyncio
from typing import Any

import numpy as np

from piximi_link.peer import HandlerContext
from piximi_schema.segmentation import (
    ChannelPolicyFixed,
    ChannelPolicyPassthrough,
    ModelLink,
    ModelResources,
    NumberOptionField,
    OptionGroup,
    OptionSchema,
    OutputPolicySingle,
)

from .base import Detection, SegmentationModel, labels_to_detections

SOURCES = [
    ModelLink(text="cellcast", url="https://github.com/uw-loci/cellcast"),
    ModelLink(text="StarDist", url="https://github.com/stardist/stardist"),
]
CITE = [
    ModelLink(
        text="Cell Detection with Star-Convex Polygons",
        url="https://doi.org/10.1007/978-3-030-00934-2_30",
    )
]

# cellcast's own defaults, shown so the user knows what "empty" means.
OPTION_SCHEMA = OptionSchema(
    groups=[
        OptionGroup(
            id="detection",
            label="Detection",
            fields=[
                NumberOptionField(
                    key="probThreshold",
                    label="Probability threshold",
                    type="number",
                    optional=True,
                    empty_label="Model default (0.48)",
                    min=0,
                    max=1,
                    step=0.01,
                    tooltip="Objects with a lower probability are dropped",
                ),
                NumberOptionField(
                    key="nmsThreshold",
                    label="Overlap threshold",
                    type="number",
                    optional=True,
                    empty_label="Model default (0.3)",
                    min=0,
                    max=1,
                    step=0.01,
                    tooltip="Overlapping candidates beyond this are merged by non-maximum suppression",
                ),
            ],
        ),
        OptionGroup(
            id="normalization",
            label="Normalization",
            fields=[
                NumberOptionField(
                    key="pmin",
                    label="Low percentile",
                    type="number",
                    default=1.0,
                    min=0,
                    max=100,
                    step=0.1,
                    advanced=True,
                    tooltip="Intensities below this percentile map to 0",
                ),
                NumberOptionField(
                    key="pmax",
                    label="High percentile",
                    type="number",
                    default=99.8,
                    min=0,
                    max=100,
                    step=0.1,
                    advanced=True,
                    tooltip="Intensities above this percentile map to 1",
                ),
            ],
        ),
    ]
)


def _predict_kwargs(options: dict[str, Any]) -> dict[str, Any]:
    """The subset of options cellcast takes, under its own names."""
    names = {
        "probThreshold": "prob_threshold",
        "nmsThreshold": "nms_threshold",
        "pmin": "pmin",
        "pmax": "pmax",
    }
    return {
        names[key]: float(value)
        for key, value in options.items()
        if key in names and value is not None
    }


class CellcastStarDist(SegmentationModel):
    cancellable_load = False
    framework = "cellcast"
    output_policy = OutputPolicySingle(mode="single", default_kind_name="Nucleus")
    option_schema = OPTION_SCHEMA
    sources = SOURCES
    cite = CITE

    def __init__(self, variant: str, gpu: bool = True) -> None:
        self.variant = variant
        self.gpu = gpu
        self.resources = ModelResources(gpu=gpu)
        self._model: Any = None
        if variant == "fluo":
            self.id = "cellcast-stardist-fluo"
            self.display_name = "StarDist2D fluorescence (cellcast)"
            self.description = "Star-convex nucleus segmentation, versatile fluorescence weights"
            self.use = "Nuclei in a single fluorescence channel (e.g. DAPI)"
            self.channel_policy = ChannelPolicyPassthrough(mode="passthrough", max_channels=1)
        else:
            self.id = "cellcast-stardist-he"
            self.display_name = "StarDist2D H&E (cellcast)"
            self.description = "Star-convex nucleus segmentation, versatile H&E weights"
            self.use = "Nuclei in brightfield H&E images (RGB)"
            self.channel_policy = ChannelPolicyFixed(mode="fixed", count=3)

    @property
    def loaded(self) -> bool:
        return self._model is not None

    async def load(self, ctx: HandlerContext) -> None:
        if self._model is not None:
            return
        ctx.progress({"percent": -1, "message": "Loading StarDist2D weights"})
        from cellcast.models import StarDist2D  # noqa: PLC0415

        init = StarDist2D.init_fluo if self.variant == "fluo" else StarDist2D.init_he
        self._model = await asyncio.to_thread(init, gpu=self.gpu)
        ctx.progress({"percent": 100, "message": "Model loaded"})

    def segment(
        self, image: np.ndarray, options: dict[str, Any], kind_name: str, ctx: HandlerContext
    ) -> list[Detection]:
        if self._model is None:
            raise RuntimeError("Model not loaded")
        kwargs = _predict_kwargs(options)
        if self.variant == "fluo":
            plane = image.mean(axis=0) if image.shape[0] > 1 else image[0]
            labels = self._model.predict_fluo(np.ascontiguousarray(plane), **kwargs)
        else:
            rgb = np.moveaxis(image[:3], 0, -1)
            labels = self._model.predict_he(np.ascontiguousarray(rgb), **kwargs)
        return labels_to_detections(np.asarray(labels), kind_name)
