"""StarDist2D through cellcast on a real image. Skipped when cellcast is not
installed; `gpu=False` keeps it runnable where there is no GPU adapter."""

from pathlib import Path

import imageio.v3 as iio
import numpy as np
import pytest

from piximi_engine.models.cellcast import CellcastStarDist
from piximi_link.peer import HandlerContext

pytest.importorskip("cellcast")

CELL_PAINTING = Path(__file__).resolve().parents[4] / "src" / "images" / "cell-painting.png"


@pytest.mark.skipif(not CELL_PAINTING.is_file(), reason="representative image not present")
async def test_fluo_model_finds_nuclei_in_cell_painting():
    model = CellcastStarDist("fluo", gpu=False)
    assert model.describe().option_schema is not None
    await model.load(HandlerContext(None))

    image = iio.imread(CELL_PAINTING)
    nuclei = np.ascontiguousarray(image[..., 2])[np.newaxis]  # (C, Y, X): the DAPI-like channel
    detections = model.segment(nuclei, {}, "Nucleus", HandlerContext(None))

    assert 60 < len(detections) < 150
    first = detections[0]
    x0, y0, x1, y1 = first.bbox
    assert first.mask.shape == (y1 - y0, x1 - x0) and first.mask.any()

    # Options reach the model: a lenient probability threshold keeps at least as many.
    lenient = model.segment(nuclei, {"probThreshold": 0.2}, "Nucleus", HandlerContext(None))
    assert len(lenient) >= len(detections)
