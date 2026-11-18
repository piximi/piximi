"""Cellpose 3 on PyTorch, run in the plugin's own environment."""

from __future__ import annotations

from typing import Any

import numpy as np

from piximi_model_sdk import Context, SegmentationModel


class Cellpose(SegmentationModel):
    def __init__(self, model_type: str) -> None:
        self.model_type = model_type
        self._model: Any = None

    def load(self, ctx: Context) -> None:
        if self._model is not None:
            return
        import torch
        from cellpose import models  # the environment's cellpose

        # CUDA only: Cellpose 3's Apple-GPU (MPS) path fails inside its own
        # flow computation, so a Mac runs it on the CPU.
        gpu = bool(self.settings.get("gpu", True)) and torch.cuda.is_available()
        ctx.progress(f"Loading Cellpose {self.model_type} ({'GPU' if gpu else 'CPU'}); downloads weights the first time")
        # `Cellpose` pairs the segmenter with the size model that estimates diameters.
        self._model = models.Cellpose(gpu=gpu, model_type=self.model_type)
        ctx.progress("Weights loaded", 100)

    def segment(self, image: np.ndarray, options: dict[str, Any], ctx: Context) -> np.ndarray:
        # (C, Y, X) -> (Y, X, C); Cellpose's channel indices are 1-based, 0 is "none".
        data = np.moveaxis(image, 0, -1)
        channels = [1, 2] if data.shape[-1] >= 2 else [0, 0]
        diameter = options.get("diameter")
        masks, *_ = self._model.eval(
            data,
            diameter=None if diameter is None else float(diameter),
            channels=channels,
            flow_threshold=float(options.get("flowThreshold", 0.4)),
            cellprob_threshold=float(options.get("cellprobThreshold", 0.0)),
        )
        return np.asarray(masks)

    def unload(self) -> None:
        self._model = None


CYTO3 = Cellpose("cyto3")
NUCLEI = Cellpose("nuclei")
