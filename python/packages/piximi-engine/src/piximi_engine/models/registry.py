from __future__ import annotations

import importlib.util

from .base import SegmentationModel
from .threshold import ThresholdSegmenter


def default_models(*, gpu: bool = True) -> dict[str, SegmentationModel]:
    """The models this engine serves: the threshold baseline always, and the
    cellcast StarDist variants when the optional package is installed."""
    models: list[SegmentationModel] = [ThresholdSegmenter()]
    if importlib.util.find_spec("cellcast") is not None:
        from .cellcast import CellcastStarDist  # noqa: PLC0415

        models.extend([CellcastStarDist("fluo", gpu=gpu), CellcastStarDist("he", gpu=gpu)])
    return {model.id: model for model in models}
