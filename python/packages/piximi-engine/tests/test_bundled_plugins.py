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
from piximi_engine.plugins import CELLCAST, CELLPOSE, TORCH_CNN
from piximi_link.peer import HandlerContext
from piximi_schema.query import AnnotationQuery, ImageQuery
from piximi_schema.segmentation import SegmentationRunRequest

CELL_PAINTING = Path(__file__).resolve().parents[4] / "src" / "images" / "cell-painting.png"


def test_bundled_manifests_parse_and_are_advertised():
    for path in (CELLCAST, CELLPOSE):
        manifest = load_manifest(path)
        assert manifest.plugin.resources.gpu is True
        assert len(manifest.models) == 2
    cnn = load_manifest(TORCH_CNN)
    assert cnn.models[0].classifies and not cnn.models[0].segments and cnn.models[0].output is None
    assert {ep.name for ep in entry_points(group="piximi.models")} >= {"cellcast", "cellpose", "torch-cnn"}

    registry = ModelRegistry()
    registry.discover_entry_points()
    assert {"cellcast-stardist-fluo", "cellcast-stardist-he", "cellpose-cyto3", "cellpose-nuclei"} <= set(
        registry.models
    )
    assert "torch-simple-cnn" in registry.classifiers


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


@pytest.mark.skipif(not os.environ.get("PIXIMI_TORCH_TEST"), reason="pulls PyTorch; set PIXIMI_TORCH_TEST=1")
async def test_torch_simple_cnn_trains_and_predicts(images_dir: Path):
    """The PyTorch Simple CNN trains on the fixture's labeled images on the
    engine, through its own environment, and predicts the one left."""
    pytest.importorskip("appose")
    from piximi_schema.classification import (
        IMAGE_TARGET_ID,
        ClassifierCreateRequest,
        ClassifierFitRequest,
        ClassifierHyperparameters,
        ClassifierPredictRequest,
        CropOptions,
        CropSchema,
        LossFunction,
        Metric,
        NormalizeOptions,
        OptimizationAlgorithm,
        OptimizerSettings,
        PreprocessSettings,
    )
    from piximi_schema.entities import ImageCategory, Shape
    from piximi_schema.query import PageRequest
    from piximi_schema.unknown import generate_uuid

    engine = ReferenceEngine(images_dir / ".piximi")
    engine.ingest_folder(images_dir)
    try:
        dark = ImageCategory(type="image", id=generate_uuid(), color="#000", name="Dark", is_unknown=False)
        bright = ImageCategory(type="image", id=generate_uuid(), color="#fff", name="Bright", is_unknown=False)
        await engine.categories_create([dark, bright])
        page = await engine.images(ImageQuery(), None, PageRequest(limit=10))
        by_name = {record.image.name: record.image.id for record in page.items}
        await engine.images_categorize(ImageQuery(ids=[by_name["c"], by_name["d"]]), dark.id)
        await engine.images_categorize(ImageQuery(ids=[by_name["a"], by_name["b"]]), bright.id)
        record = await engine.classification_create(
            ClassifierCreateRequest(
                target_id=IMAGE_TARGET_ID,
                name="CNN",
                architecture_id="torch-simple-cnn",
                hyperparameters=ClassifierHyperparameters(
                    preprocess=PreprocessSettings(
                        shuffle=True,
                        input_shape=Shape(planes=1, height=20, width=20, channels=1),
                        normalize_options=NormalizeOptions(normalize=True, center=False),
                        crop_options=CropOptions(num_crops=1, crop_schema=CropSchema.NONE),
                        training_percentage=0.5,
                    ),
                    optimizer=OptimizerSettings(
                        learning_rate=0.01,
                        loss_function=LossFunction.CATEGORICAL_CROSS_ENTROPY,
                        metrics=[Metric.CATEGORICAL_ACCURACY],
                        optimization_algorithm=OptimizationAlgorithm.ADAM,
                        epochs=4,
                        batch_size=2,
                    ),
                ),
                seed=1,
            )
        )
        progress = []
        summary = await engine.classification_fit(
            ClassifierFitRequest(classifier_id=record.id, seed=1), HandlerContext(progress.append)
        )
        assert summary.status == "completed"
        trained = next(c for c in await engine.classification_list() if c.id == record.id)
        run = trained.runs[-1]
        assert len(run.history) == 4 and run.framework_version.startswith("2.")
        assert run.device in ("cpu", "cuda", "mps")
        assert [layer.layer_name for layer in trained.summary][0] == "conv2d"
        predicted = await engine.classification_predict(
            ClassifierPredictRequest(classifier_id=record.id), HandlerContext(None)
        )
        assert predicted.predicted == 1
    finally:
        await engine.close()
