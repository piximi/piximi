"""Classification on the engine: records, the fit and predict jobs, what
they write back, and the archives."""

from pathlib import Path

import pytest
from piximi_engine import ReferenceEngine
from piximi_engine.classification.models import LogisticArchitecture
from piximi_engine.models.threshold import ThresholdSegmenter
from piximi_link.errors import BackendError
from piximi_link.peer import HandlerContext
from piximi_schema.capabilities import Capability
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
from piximi_schema.entities import AnnotationCategory, ImageCategory, ImageObject, Kind, Partition, Shape
from piximi_schema.query import AnnotationQuery, AnnotationSort, ImageQuery, ImageSort, PageRequest
from piximi_schema.segmentation import SegmentationRunRequest
from piximi_schema.unknown import generate_uuid, represents_unknown


@pytest.fixture
def classifying(images_dir: Path) -> ReferenceEngine:
    engine = ReferenceEngine(
        images_dir / ".piximi", models={"threshold": ThresholdSegmenter(), "logistic": LogisticArchitecture()}
    )
    engine.ingest_folder(images_dir)
    return engine


def hyperparameters(epochs: int = 3, channels: int = 1) -> ClassifierHyperparameters:
    return ClassifierHyperparameters(
        preprocess=PreprocessSettings(
            shuffle=True,
            input_shape=Shape(planes=1, height=8, width=8, channels=channels),
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


def ctx() -> HandlerContext:
    return HandlerContext(None)


async def images_by_name(engine: ReferenceEngine) -> dict[str, ImageObject]:
    page = await engine.images(ImageQuery(), None, PageRequest(limit=100))
    return {record.image.name: record.image for record in page.items}


async def label_images(engine: ReferenceEngine) -> tuple[ImageCategory, ImageCategory]:
    first = ImageCategory(type="image", id=generate_uuid(), color="#ff0000", name="First", is_unknown=False)
    second = ImageCategory(type="image", id=generate_uuid(), color="#00ff00", name="Second", is_unknown=False)
    await engine.categories_create([first, second])
    images = await images_by_name(engine)
    await engine.images_categorize(ImageQuery(ids=[images["a"].id, images["b"].id]), first.id)
    await engine.images_categorize(ImageQuery(ids=[images["c"].id, images["d"].id]), second.id)
    return first, second


async def test_declares_classification_when_an_architecture_is_registered(
    engine: ReferenceEngine, classifying: ReferenceEngine
):
    assert Capability.CLASSIFICATION not in engine.capabilities()
    assert Capability.CLASSIFICATION in classifying.capabilities()
    assert Capability.CLASSIFICATION_TRAIN in classifying.capabilities()
    listed = await classifying.classification_list_architectures()
    assert [model.name for model in listed] == ["logistic"]
    assert "classification.train" in listed[0].tasks
    # The architecture is also in the full model list, without an output policy.
    assert any(model.name == "logistic" and model.output_policy is None for model in classifying.models.describe_all())


async def test_fit_predict_settle_and_archive(classifying: ReferenceEngine):
    engine = classifying
    first, second = await label_images(engine)
    events = []
    engine.subscribe(events.append)

    record = await engine.classification_create(
        ClassifierCreateRequest(
            target_id=IMAGE_TARGET_ID, name="Shades", architecture_id="logistic", hyperparameters=hyperparameters(), seed=7
        )
    )
    assert record.trained is False and record.runs == [] and record.framework == "numpy"
    assert events[-1].type == "classifiers/didChange"

    summary = await engine.classification_fit(ClassifierFitRequest(classifier_id=record.id, seed=7), ctx())
    assert summary.status == "completed" and summary.run_id and summary.eval_results is not None
    epochs = [event for event in events if event.type == "classifiers/didEpoch"]
    assert len(epochs) == 3 and all(event.run_id == summary.run_id for event in epochs)
    trained = next(c for c in await engine.classification_list() if c.id == record.id)
    assert trained.trained and trained.busy is None and trained.summary
    assert sorted(trained.class_map.values()) == sorted([first.id, second.id])
    run = trained.runs[-1]
    assert run.status == "completed" and len(run.history) == 3 and run.eval_results == summary.eval_results
    assert run.trigger == "fresh" and run.device == "cpu"
    # The split placed the labeled items; the unlabeled one waits.
    counts = await engine.image_counts(ImageQuery(), "partition")
    assert counts.groups == {Partition.TRAINING: 2, Partition.VALIDATION: 2, Partition.INFERENCE: 1}
    jobs = await engine.jobs_list()
    assert jobs[-1].kind == "classifier-fit" and jobs[-1].status == "succeeded"
    # Weights are on disk, so another engine on this directory can predict.
    assert (engine.project_dir / "classifiers" / f"{record.id}.bin").is_file()

    predicted = await engine.classification_predict(ClassifierPredictRequest(classifier_id=record.id), ctx())
    assert predicted.predicted == 1 and predicted.cancelled is False
    images = await images_by_name(engine)
    e = images["e"]
    assert not represents_unknown(e.category_id) and e.partition == Partition.INFERENCE
    assert e.predicted_at_run_id == summary.run_id and 0 < e.prediction_confidence <= 1
    # The softmax order puts the predicted item first; the rest keep their order.
    ordered = await engine.image_ids(ImageQuery(), ImageSort(key="softmax"))
    assert ordered[0] == e.id and len(ordered) == 5
    # The record went busy and idle around the prediction, which was announced.
    busy = [event.classifiers[0].busy for event in events if event.type == "classifiers/didChange"]
    assert "predicting" in busy and busy[-1] is None
    assert any(event.type == "images/didUpdate" and event.updates[0].id == e.id for event in events)

    # Clearing returns it to unknown; predicting again and accepting keeps it.
    assert (await engine.classification_clear_predictions(IMAGE_TARGET_ID)).changed == 1
    e = (await images_by_name(engine))["e"]
    assert represents_unknown(e.category_id) and e.partition == Partition.INFERENCE
    await engine.classification_predict(ClassifierPredictRequest(classifier_id=record.id), ctx())
    assert (await engine.classification_accept_predictions(IMAGE_TARGET_ID)).changed == 1
    e = (await images_by_name(engine))["e"]
    assert not represents_unknown(e.category_id) and e.partition == Partition.UNASSIGNED
    assert (await engine.image_ids(ImageQuery(), ImageSort(key="softmax"))) == [im.id for im in images.values()]

    evaluation = await engine.classification_evaluate(record.id)
    assert 0 <= evaluation.accuracy <= 1 and len(evaluation.confusion_matrix) == 2

    # A continued run trains on what was labeled since (nothing new here).
    again = await engine.classification_fit(ClassifierFitRequest(classifier_id=record.id), ctx())
    assert again.status == "completed"
    assert (await engine.classification_list())[0].runs[-1].trigger == "continue"

    archive = await engine.classification_export(record.id)
    assert archive.file_name == "Shades.zip" and archive.data[:2] == b"PK"
    imported = await engine.classification_import(
        ClassifierImportRequest(target_id=IMAGE_TARGET_ID, data=archive.data, name="Shades copy")
    )
    assert imported.name == "Shades copy" and imported.trained and len(imported.runs) == 2
    assert imported.class_map == trained.class_map and imported.id != record.id

    await engine.classification_delete(record.id)
    assert [c.name for c in await engine.classification_list()] == ["Shades copy"]
    assert not (engine.project_dir / "classifiers" / f"{record.id}.bin").exists()
    with pytest.raises(BackendError):
        await engine.classification_delete(record.id)


async def test_fit_needs_labeled_items(classifying: ReferenceEngine):
    record = await classifying.classification_create(
        ClassifierCreateRequest(
            target_id=IMAGE_TARGET_ID, name="Empty", architecture_id="logistic", hyperparameters=hyperparameters()
        )
    )
    with pytest.raises(BackendError) as info:
        await classifying.classification_fit(ClassifierFitRequest(classifier_id=record.id), ctx())
    assert info.value.code == "PREPROCESS_FAILED"
    assert (await classifying.jobs_list())[-1].status == "failed"
    assert (await classifying.classification_list())[0].busy is None


async def test_fit_stops_when_its_job_is_cancelled(classifying: ReferenceEngine):
    engine = classifying
    await label_images(engine)
    record = await engine.classification_create(
        ClassifierCreateRequest(
            target_id=IMAGE_TARGET_ID, name="Long", architecture_id="logistic", hyperparameters=hyperparameters(epochs=200)
        )
    )
    seen = []

    def on_progress(value):
        seen.append(value)
        if len(seen) == 3:
            # The running job is the last one started; cancel it from a client.
            job = engine.jobs.list()[-1]
            engine.jobs.cancel(job.id)

    summary = await engine.classification_fit(
        ClassifierFitRequest(classifier_id=record.id), HandlerContext(on_progress)
    )
    assert summary.status == "stopped"
    run = (await engine.classification_list())[0].runs[-1]
    assert run.status == "stopped" and 0 < len(run.history) < 200
    assert (await engine.jobs_list())[-1].status == "cancelled"


async def test_category_changes_invalidate_trained_classifiers(classifying: ReferenceEngine):
    engine = classifying
    first, second = await label_images(engine)

    def create(name: str) -> ClassifierCreateRequest:
        return ClassifierCreateRequest(
            target_id=IMAGE_TARGET_ID, name=name, architecture_id="logistic", hyperparameters=hyperparameters(epochs=1)
        )

    trained = await engine.classification_create(create("Shades"))
    spare = await engine.classification_create(create("Spare"))

    def category(name: str, color: str) -> ImageCategory:
        return ImageCategory(type="image", id=generate_uuid(), color=color, name=name, is_unknown=False)

    # Before any run the categories may change freely.
    await engine.categories_create([category("Third", "#0000ff")])
    assert all(record.valid for record in await engine.classification_list())
    await engine.classification_fit(ClassifierFitRequest(classifier_id=trained.id, seed=7), ctx())
    # Renaming changes nothing either.
    await engine.categories_update(first.id, name="Primary", color=None)
    assert all(record.valid for record in await engine.classification_list())

    # Adding a category invalidates the classifiers that have run, and the
    # change is announced; continuing one of them is refused.
    events = []
    engine.subscribe(events.append)
    await engine.categories_create([category("Fourth", "#ffff00")])
    assert {record.name: record.valid for record in await engine.classification_list()} == {
        "Shades": False,
        "Spare": True,
    }
    announced = [event for event in events if event.type == "classifiers/didChange"][-1]
    assert {record.name: record.valid for record in announced.classifiers} == {"Shades": False, "Spare": True}
    with pytest.raises(BackendError) as info:
        await engine.classification_fit(ClassifierFitRequest(classifier_id=trained.id), ctx())
    assert info.value.code == "TRAINING_FAILED"

    # Predicting among the classes it knows still works...
    predicted = await engine.classification_predict(ClassifierPredictRequest(classifier_id=trained.id), ctx())
    assert predicted.predicted == 1
    await engine.classification_clear_predictions(IMAGE_TARGET_ID)
    # ...until one of them is gone, which would make the prediction dangle.
    await engine.categories_delete([second.id])
    with pytest.raises(BackendError) as info:
        await engine.classification_predict(ClassifierPredictRequest(classifier_id=trained.id), ctx())
    assert info.value.code == "PREDICTION_FAILED"
    assert all(image.category_id != second.id for image in (await images_by_name(engine)).values())


async def test_objects_of_a_kind(classifying: ReferenceEngine):
    engine = classifying
    images = await images_by_name(engine)
    await engine.segmentation_run(
        SegmentationRunRequest(
            model_id="threshold", image_ids=[images["a"].id, images["b"].id], channel_meta_ids=[], kind_name="Cell"
        ),
        ctx(),
    )
    kind = next(k for k in engine.meta.list("kind", Kind) if k.name == "Cell")
    round_ = AnnotationCategory(
        type="annotation", id=generate_uuid(), color="#ff0000", name="Round", is_unknown=False, kind_id=kind.id
    )
    square = AnnotationCategory(
        type="annotation", id=generate_uuid(), color="#0000ff", name="Square", is_unknown=False, kind_id=kind.id
    )
    await engine.categories_create([round_, square])
    on_a = await engine.annotation_ids(AnnotationQuery(image_ids=[images["a"].id]))
    on_b = await engine.annotation_ids(AnnotationQuery(image_ids=[images["b"].id]))
    assert len(on_a) == 2 and len(on_b) == 2
    await engine.annotations_categorize(AnnotationQuery(ids=on_a), round_.id)
    await engine.annotations_categorize(AnnotationQuery(ids=on_b[:1]), square.id)

    record = await engine.classification_create(
        ClassifierCreateRequest(
            target_id=kind.id, name="Shapes", architecture_id="logistic", hyperparameters=hyperparameters(epochs=2)
        )
    )
    summary = await engine.classification_fit(ClassifierFitRequest(classifier_id=record.id, seed=1), ctx())
    assert summary.status == "completed"
    counts = await engine.annotation_counts(AnnotationQuery(kind_ids=[kind.id]), "partition")
    assert counts.groups == {Partition.TRAINING: 2, Partition.VALIDATION: 1, Partition.INFERENCE: 1}

    predicted = await engine.classification_predict(ClassifierPredictRequest(classifier_id=record.id), ctx())
    assert predicted.predicted == 1
    page = await engine.annotations(AnnotationQuery(ids=on_b[1:]), None, PageRequest(limit=1))
    volume = page.items[0].volume
    assert volume.category_id in (round_.id, square.id) and volume.predicted_at_run_id == summary.run_id
    ordered = await engine.annotation_ids(AnnotationQuery(kind_ids=[kind.id]), AnnotationSort(key="softmax"))
    assert ordered[0] == on_b[1]
    assert (await engine.classification_accept_predictions(kind.id)).changed == 1
    assert (await engine.annotation_counts(AnnotationQuery(kind_ids=[kind.id], partitions=[Partition.INFERENCE]))).total == 0
