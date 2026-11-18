"""The plugins the engine ships: their manifests always; the models
themselves only with PIXIMI_APPOSE_TEST=1 (cellcast, a small download) and
PIXIMI_CELLPOSE_TEST=1 (Cellpose, which pulls PyTorch)."""

from __future__ import annotations

import os
from importlib.metadata import entry_points
from pathlib import Path

import imageio.v3 as iio
import numpy as np
import pytest

from piximi_engine import ReferenceEngine
from piximi_engine.models.manifest import load_manifest
from piximi_engine.models.registry import ModelRegistry
from piximi_engine.plugins import CELLCAST, CELLPOSE
from piximi_link.peer import HandlerContext
from piximi_schema.query import AnnotationQuery, ImageQuery
from piximi_schema.segmentation import SegmentationRunRequest

CELL_PAINTING = Path(__file__).resolve().parents[4] / "src" / "images" / "cell-painting.png"


def test_bundled_manifests_parse_and_are_advertised():
    for path in (CELLCAST, CELLPOSE):
        manifest = load_manifest(path)
        assert manifest.plugin.resources.gpu is True
        assert len(manifest.models) == 2
    assert {ep.name for ep in entry_points(group="piximi.models")} >= {"cellcast", "cellpose"}

    registry = ModelRegistry()
    registry.discover_entry_points()
    assert {"cellcast-stardist-fluo", "cellcast-stardist-he", "cellpose-cyto3", "cellpose-nuclei"} <= set(
        registry.models
    )


@pytest.fixture
def nuclei_engine(tmp_path: Path) -> ReferenceEngine:
    if not CELL_PAINTING.is_file():
        pytest.skip("representative image not present")
    image = iio.imread(CELL_PAINTING)
    nuclei = np.ascontiguousarray(image[..., 2])
    iio.imwrite(tmp_path / "nuclei.png", nuclei)
    engine = ReferenceEngine(tmp_path / ".piximi")
    engine.ingest_folder(tmp_path)
    return engine


async def run(engine: ReferenceEngine, model_id: str, **options):
    ids = await engine.image_ids(ImageQuery())
    summary = await engine.segmentation_run(
        SegmentationRunRequest(model_id=model_id, image_ids=ids, channel_meta_ids=[], options=options or None),
        HandlerContext(None),
    )
    assert not summary.cancelled
    return summary


@pytest.mark.skipif(not os.environ.get("PIXIMI_APPOSE_TEST"), reason="builds the cellcast environment")
async def test_cellcast_plugin_finds_nuclei(nuclei_engine: ReferenceEngine):
    engine = nuclei_engine
    try:
        progress = []
        await engine.segmentation_load_model("cellcast-stardist-fluo", HandlerContext(progress.append))
        assert any("StarDist2D" in p["message"] for p in progress)
        summary = await run(engine, "cellcast-stardist-fluo")
        assert 60 < summary.added < 150
        lenient = await run(engine, "cellcast-stardist-fluo", probThreshold=0.2)
        # The same nuclei again are duplicates; only extra ones land.
        assert lenient.added + lenient.skipped >= summary.added
        assert (await engine.annotation_counts(AnnotationQuery())).total == summary.added + lenient.added
    finally:
        await engine.close()


@pytest.mark.skipif(not os.environ.get("PIXIMI_CELLPOSE_TEST"), reason="builds the Cellpose environment (PyTorch)")
async def test_cellpose_plugin_finds_nuclei(nuclei_engine: ReferenceEngine):
    engine = nuclei_engine
    try:
        await engine.segmentation_load_model("cellpose-nuclei", HandlerContext(None))
        summary = await run(engine, "cellpose-nuclei", diameter=20)
        assert 40 < summary.added < 200
    finally:
        await engine.close()
