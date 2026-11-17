"""StarDist2D through cellcast (https://github.com/uw-loci/cellcast): the
model recast in Rust/Burn on a WebGPU backend, so it runs on the GPU on
macOS too. Registered only when the optional ``cellcast`` package is present.
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


class CellcastStarDist(SegmentationModel):
    cancellable_load = False
    output_policy = OutputPolicySingle(mode="single", default_kind_name="Nucleus")
    sources = SOURCES
    cite = CITE

    def __init__(self, variant: str, gpu: bool = True) -> None:
        self.variant = variant
        self.gpu = gpu
        self._model: Any = None
        if variant == "fluo":
            self.id = "cellcast-stardist-fluo"
            self.display_name = "StarDist2D fluorescence (cellcast)"
            self.description = "Star-convex nucleus segmentation, versatile fluorescence weights"
            self.use = "Nuclei in single-channel fluorescence images"
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
        if self.variant == "fluo":
            plane = image.mean(axis=0) if image.shape[0] > 1 else image[0]
            labels = self._model.predict_fluo(np.ascontiguousarray(plane))
        else:
            rgb = np.moveaxis(image[:3], 0, -1)
            labels = self._model.predict_he(np.ascontiguousarray(rgb))
        return labels_to_detections(np.asarray(labels), kind_name)
