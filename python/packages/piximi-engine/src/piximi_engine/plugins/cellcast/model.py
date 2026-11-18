"""StarDist2D through cellcast, run in the plugin's own environment."""

from __future__ import annotations

from typing import Any

import numpy as np

from piximi_model_sdk import Context, SegmentationModel

# The option keys the manifest declares, under cellcast's own names.
PREDICT_KWARGS = {
    "probThreshold": "prob_threshold",
    "nmsThreshold": "nms_threshold",
    "pmin": "pmin",
    "pmax": "pmax",
}


class StarDist2D(SegmentationModel):
    def __init__(self, variant: str) -> None:
        self.variant = variant
        self._model: Any = None

    def load(self, ctx: Context) -> None:
        if self._model is not None:
            return
        from cellcast.models import StarDist2D as Model  # the environment's cellcast

        gpu = bool(self.settings.get("gpu", True))
        ctx.progress(f"Loading StarDist2D {self.variant} weights ({'GPU' if gpu else 'CPU'})")
        init = Model.init_fluo if self.variant == "fluo" else Model.init_he
        self._model = init(gpu=gpu)
        ctx.progress("Weights loaded", 100)

    def segment(self, image: np.ndarray, options: dict[str, Any], ctx: Context) -> np.ndarray:
        kwargs = {
            PREDICT_KWARGS[key]: float(value)
            for key, value in options.items()
            if key in PREDICT_KWARGS and value is not None
        }
        if self.variant == "fluo":
            plane = image.mean(axis=0) if image.shape[0] > 1 else image[0]
            labels = self._model.predict_fluo(np.ascontiguousarray(plane), **kwargs)
        else:
            rgb = np.moveaxis(image[:3], 0, -1)
            labels = self._model.predict_he(np.ascontiguousarray(rgb), **kwargs)
        return np.asarray(labels)

    def unload(self) -> None:
        self._model = None


FLUO = StarDist2D("fluo")
HE = StarDist2D("he")
