"""Plugins in their own environments, end to end: two whose requirements
conflict run in one session, images cross through shared memory, a run
cancels mid-image, and a plugin registered from a notebook shows up live.

These build real environments with uv (network, ~30 s each the first
time; Appose caches them under ``APPOSE_ENVS_DIR``), so they run only
with ``PIXIMI_APPOSE_TEST=1``.
"""

from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path

import pytest

from piximi_engine import ReferenceEngine
from piximi_engine.api import Project
from piximi_engine.notebook import serve
from piximi_link import Peer
from piximi_link.peer import HandlerContext
from piximi_link.transports.websocket import connect
from piximi_schema import PROTOCOL_VERSION
from piximi_schema.entities import Kind
from piximi_schema.query import AnnotationQuery, ImageQuery, PageRequest
from piximi_schema.segmentation import ModelStatus, SegmentationRunRequest

pytestmark = pytest.mark.skipif(
    not os.environ.get("PIXIMI_APPOSE_TEST"), reason="builds plugin environments; set PIXIMI_APPOSE_TEST=1"
)
pytest.importorskip("appose")

PLUGINS = Path(__file__).parent / "plugins"
ONE, TWO = "threshold-numpy-one", "threshold-numpy-two"


@pytest.fixture
def plugin_engine(images_dir: Path) -> ReferenceEngine:
    engine = ReferenceEngine(images_dir / ".piximi", models_dirs=[PLUGINS])
    engine.ingest_folder(images_dir)
    return engine


async def image_ids(engine: ReferenceEngine) -> list[str]:
    return await engine.image_ids(ImageQuery())


async def test_conflicting_plugins_run_side_by_side(plugin_engine: ReferenceEngine):
    engine = plugin_engine
    events = []
    engine.subscribe(events.append)
    try:
        statuses: dict[str, list[str]] = {ONE: [], TWO: []}
        for model_id in (ONE, TWO):
            progress = []
            await engine.segmentation_load_model(model_id, HandlerContext(progress.append))
            for event in events:
                if event.type == "models/didChange":
                    status = next(m.status for m in event.models if m.name == model_id)
                    if not statuses[model_id] or statuses[model_id][-1] != status:
                        statuses[model_id].append(status)
            assert progress and any("environment" in p["message"].lower() for p in progress)
            assert progress[-1]["message"].startswith("numpy ")
        for model_id in (ONE, TWO):
            assert statuses[model_id][-1] == ModelStatus.LOADED
            assert ModelStatus.BUILDING in statuses[model_id] or ModelStatus.READY in statuses[model_id]

        ids = await image_ids(engine)
        for model_id in (ONE, TWO):
            summary = await engine.segmentation_run(
                SegmentationRunRequest(model_id=model_id, image_ids=ids, channel_meta_ids=["channel-meta-0"]),
                HandlerContext(None),
            )
            assert summary.added > 0 and not summary.cancelled

        # Each worker labelled its objects with the numpy major it imported.
        kinds = {kind.name: kind.id for kind in engine.meta.list("kind", Kind)}
        assert {"numpy1", "numpy2"} <= set(kinds)
        for name in ("numpy1", "numpy2"):
            counted = await engine.annotation_counts(AnnotationQuery(kind_ids=[kinds[name]]))
            assert counted.total > 0

        descriptors = {d.name: d for d in await engine.segmentation_list_models()}
        assert descriptors[ONE].status == ModelStatus.LOADED and descriptors[TWO].status == ModelStatus.LOADED
    finally:
        await engine.close()
    assert not any(service.alive for service in engine.models.plugins.values())


async def test_images_cross_through_shared_memory(plugin_engine: ReferenceEngine):
    engine = plugin_engine
    lines: list[str] = []
    engine.models.plugins["numpy-two"].on_debug = lines.append
    try:
        await engine.segmentation_load_model(TWO, HandlerContext(None))
        ids = await image_ids(engine)
        await engine.segmentation_run(
            SegmentationRunRequest(model_id=TWO, image_ids=ids[:1], channel_meta_ids=[]), HandlerContext(None)
        )
    finally:
        await engine.close()
    requests = [line for line in lines if '"requestType":"EXECUTE"' in line and "worker.segment" in line]
    assert requests, "no segment request seen"
    payload = json.loads(requests[0].split("] ", 1)[1])
    image = payload["inputs"]["image"]
    assert image["appose_type"] == "ndarray" and image["shm"]["appose_type"] == "shm"
    assert len(requests[0]) < 1024  # the name of the block, not its pixels


async def test_cancel_lands_mid_image(plugin_engine: ReferenceEngine):
    engine = plugin_engine
    try:
        await engine.segmentation_load_model(ONE, HandlerContext(None))
        ids = await image_ids(engine)
        run = asyncio.create_task(
            engine.segmentation_run(
                SegmentationRunRequest(
                    model_id=ONE, image_ids=ids, channel_meta_ids=[], options={"delay": 0.2}
                ),
                HandlerContext(None),
            )
        )
        await asyncio.sleep(0.5)
        job = next(j for j in await engine.jobs_list() if j.kind == "segmentation")
        started = asyncio.get_running_loop().time()
        await engine.jobs_cancel(job.id)
        summary = await asyncio.wait_for(run, 10)
        elapsed = asyncio.get_running_loop().time() - started
        assert summary.cancelled and summary.added == 0
        assert elapsed < 3, "the model should have noticed the cancel within a row"
        # Cooperative: the worker is still there, and the model still loaded.
        assert engine.models.plugins["numpy-one"].alive
        assert engine.models.get(ONE).loaded
    finally:
        await engine.close()


async def test_plugin_registered_from_a_notebook_appears_live(engine: ReferenceEngine, tmp_path: Path):
    project = Project(engine)
    session = await serve(engine=engine, auth=False)
    try:
        async with Peer(await connect(session.ws_url)) as client:
            await client.request(
                "initialize",
                {"protocolVersion": PROTOCOL_VERSION, "clientInfo": {"name": "t", "version": "0"}, "clientCapabilities": []},
            )
            changes = []
            client.on_notification("models/didChange", changes.append)
            assert project.register_model(PLUGINS / "numpy-two") == [TWO]
            await asyncio.sleep(0.05)
            assert changes and any(m["name"] == TWO for m in changes[-1]["models"])
            assert TWO in project.models and project.models[TWO].status == ModelStatus.READY
            progress = []
            await client.request("segmentation/loadModel", {"modelId": TWO}, on_progress=progress.append)
            await asyncio.sleep(0.05)
            assert changes[-1]["models"][-1]["status"] == "loaded"
            assert any(p["message"].startswith("numpy 2") for p in progress)
            ids = await engine.image_ids(ImageQuery())
            summary = await client.request(
                "segmentation/run", {"modelId": TWO, "imageIds": ids, "channelMetaIds": ["channel-meta-0"]}
            )
            assert summary["added"] > 0
            page = await engine.annotations(AnnotationQuery(), None, PageRequest(limit=1))
            assert page.total == summary["added"]
    finally:
        await session.stop()
        await engine.close()


async def test_classifier_trains_in_its_own_environment(plugin_engine: ReferenceEngine):
    """A classifier plugin: the environment builds on first fit, epochs come
    back as structured updates, and the weights round-trip through the worker."""
    from piximi_schema.classification import (
        IMAGE_TARGET_ID,
        ClassifierCreateRequest,
        ClassifierFitRequest,
        ClassifierHyperparameters,
        ClassifierImportRequest,
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
    from piximi_schema.entities import ImageCategory, Partition, Shape
    from piximi_schema.unknown import generate_uuid

    def hyperparameters(epochs: int) -> ClassifierHyperparameters:
        return ClassifierHyperparameters(
            preprocess=PreprocessSettings(
                shuffle=True,
                input_shape=Shape(planes=1, height=8, width=8, channels=1),
                normalize_options=NormalizeOptions(normalize=True, center=False),
                crop_options=CropOptions(num_crops=1, crop_schema=CropSchema.NONE),
                training_percentage=0.5,
            ),
            optimizer=OptimizerSettings(
                learning_rate=0.1,
                loss_function=LossFunction.CATEGORICAL_CROSS_ENTROPY,
                metrics=[Metric.CATEGORICAL_ACCURACY],
                optimization_algorithm=OptimizationAlgorithm.SGD,
                epochs=epochs,
                batch_size=2,
            ),
        )

    engine = plugin_engine
    try:
        listed = {m.name: m for m in await engine.classification_list_architectures()}
        assert "logistic-plugin" in listed and listed["logistic-plugin"].framework == "numpy"

        first = ImageCategory(type="image", id=generate_uuid(), color="#f00", name="First", is_unknown=False)
        second = ImageCategory(type="image", id=generate_uuid(), color="#0f0", name="Second", is_unknown=False)
        await engine.categories_create([first, second])
        page = await engine.images(ImageQuery(), None, PageRequest(limit=10))
        by_name = {record.image.name: record.image.id for record in page.items}
        await engine.images_categorize(ImageQuery(ids=[by_name["a"], by_name["b"]]), first.id)
        await engine.images_categorize(ImageQuery(ids=[by_name["c"], by_name["d"]]), second.id)

        events = []
        engine.subscribe(events.append)
        record = await engine.classification_create(
            ClassifierCreateRequest(
                target_id=IMAGE_TARGET_ID,
                name="Plugin shades",
                architecture_id="logistic-plugin",
                hyperparameters=hyperparameters(epochs=3),
                seed=3,
            )
        )
        progress = []
        summary = await engine.classification_fit(
            ClassifierFitRequest(classifier_id=record.id, seed=3), HandlerContext(progress.append)
        )
        assert summary.status == "completed" and summary.eval_results is not None
        epochs = [e for e in events if e.type == "classifiers/didEpoch"]
        assert len(epochs) == 3
        assert any("environment" in p["message"].lower() or "starting" in p["message"].lower() for p in progress)
        trained = next(c for c in await engine.classification_list() if c.id == record.id)
        assert trained.trained and trained.summary and trained.runs[-1].framework_version.startswith("2.")
        counts = await engine.image_counts(ImageQuery(), "partition")
        assert counts.groups == {Partition.TRAINING: 2, Partition.VALIDATION: 2, Partition.INFERENCE: 1}

        predicted = await engine.classification_predict(ClassifierPredictRequest(classifier_id=record.id), HandlerContext(None))
        assert predicted.predicted == 1

        archive = await engine.classification_export(record.id)
        imported = await engine.classification_import(
            ClassifierImportRequest(target_id=IMAGE_TARGET_ID, data=archive.data, name="Plugin copy")
        )
        assert imported.trained and imported.architecture_id == "logistic-plugin"
        # The copy predicts from the worker too, after loading the saved weights.
        await engine.classification_clear_predictions(IMAGE_TARGET_ID)
        assert (
            await engine.classification_predict(ClassifierPredictRequest(classifier_id=imported.id), HandlerContext(None))
        ).predicted == 1
    finally:
        await engine.close()
