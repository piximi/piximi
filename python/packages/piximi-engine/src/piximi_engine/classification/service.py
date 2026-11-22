"""The engine's classification domain: classifier records in the store,
their weights on disk, and the fit/predict/evaluate jobs over them.

A classifier belongs to a target (the project's images, or a kind's
objects). Fitting chooses the target's labeled items with the shared split,
writes their partitions, materializes them as arrays, trains the model and
records the run; predicting writes categories, confidences and margins back
to the items. Everything the records or items change is announced, so every
client of the session follows.
"""

from __future__ import annotations

import asyncio
import io
import json
import logging
import random
import zipfile
from collections.abc import Callable
from datetime import UTC, datetime
from pathlib import Path
from typing import TYPE_CHECKING

import numpy as np

from piximi_link.errors import BackendError, RequestCancelled
from piximi_link.peer import HandlerContext
from piximi_schema import PROTOCOL_VERSION
from piximi_schema.classification import (
    IMAGE_TARGET_ID,
    AnnotationUpdate,
    ChangedResult,
    Classifier,
    ClassifierActivity,
    ClassifierCreateRequest,
    ClassifierExportResult,
    ClassifierFitRequest,
    ClassifierFitSummary,
    ClassifierImportRequest,
    ClassifierPredictRequest,
    ClassifierPredictSummary,
    ClassifierUpdateRequest,
    EvaluationResult,
    ImageUpdate,
    Run,
    RunHistoryEpoch,
    RunHyperparameterSnapshot,
    RunStatus,
    RunTrigger,
    VolumeUpdate,
)
from piximi_schema.entities import (
    AnnotationHeader,
    AnnotationVolume,
    Category,
    Channel,
    ImageObject,
    Partition,
)
from piximi_schema.events import (
    AnnotationsDidUpdate,
    ClassifiersDidChange,
    ClassifiersDidEpoch,
    ImagesDidUpdate,
)
from piximi_schema.jobs import JobKind, JobStatus
from piximi_schema.rpc import ProgressValue
from piximi_schema.segmentation import ModelDescriptor
from piximi_schema.unknown import generate_uuid, represents_unknown

from ..store import MetaStore, annotation_index
from .dataset import Sample, annotation_sample, image_sample, materialize, repeat_labels
from .fingerprint import fingerprint_items, hash_category_set
from .metrics import evaluate
from .models import ClassificationArchitecture, ClassificationModel
from .rules import next_partition
from .split import LabeledItem, SplitOptions, split_for_training

if TYPE_CHECKING:
    from ..engine import ReferenceEngine

log = logging.getLogger(__name__)

KIND = "classifier"
"""The store kind the records live under."""
WEIGHTS_FILE = "model.bin"
RUNS_FILE = "model_runs_history.json"
MANIFEST_FILE = "piximi_manifest.json"
MANIFEST_VERSION = 2


def _now() -> str:
    return datetime.now(UTC).isoformat(timespec="milliseconds").replace("+00:00", "Z")


def _margin(probabilities: np.ndarray) -> float:
    """The gap between the top two class probabilities (``marginOf``)."""
    if probabilities.size == 0:
        return 0.0
    ordered = np.sort(probabilities)[::-1]
    top = float(ordered[0])
    second = float(ordered[1]) if ordered.size > 1 else 0.0
    return top - second


class ClassificationService:
    def __init__(self, engine: ReferenceEngine) -> None:
        self.engine = engine
        self.weights_dir = engine.project_dir / "classifiers"
        self._models: dict[str, ClassificationModel] = {}
        """Live models by classifier id; built or loaded on first use."""

    # ── Records ─────────────────────────────────────────────────────────────

    @property
    def meta(self) -> MetaStore:
        return self.engine.meta

    def list(self) -> list[Classifier]:
        return self.meta.list(KIND, Classifier)

    def record(self, classifier_id: str) -> Classifier:
        record = self.meta.get(KIND, classifier_id, Classifier)
        if record is None:
            raise BackendError("MODEL_NOT_FOUND", f"No classifier {classifier_id}")
        return record

    def _write(self, record: Classifier) -> Classifier:
        self.meta.put(KIND, record)
        self._announce()
        return record

    def _announce(self) -> None:
        self.engine._emit(ClassifiersDidChange(type="classifiers/didChange", classifiers=self.list()))

    def categories_changed(self, categories: list[Category]) -> None:
        """A trained classifier's class map names the categories it ran with,
        so once that set changes (a category added or deleted) continuing it
        would train against classes it cannot represent; the record is marked
        invalid, as the frontend marks its own, and a new classifier is the
        way forward. Untrained records keep following the categories."""
        targets = {IMAGE_TARGET_ID if category.type == "image" else category.kind_id for category in categories}
        changed = False
        for record in self.list():
            if record.target_id in targets and record.runs and record.valid:
                self.meta.put(KIND, record.model_copy(update={"valid": False}))
                changed = True
        if changed:
            self._announce()

    def _architecture(self, architecture_id: str) -> ClassificationArchitecture:
        architecture = self.engine.models.classifiers.get(architecture_id)
        if architecture is None:
            raise BackendError("MODEL_NOT_FOUND", f"No architecture {architecture_id}")
        return architecture

    def _weights_path(self, classifier_id: str) -> Path:
        return self.weights_dir / f"{classifier_id}.bin"

    def _model(self, record: Classifier) -> ClassificationModel | None:
        """The live model, loading saved weights when there are any."""
        model = self._models.get(record.id)
        if model is not None:
            return model
        path = self._weights_path(record.id)
        if not path.is_file():
            return None
        model = self._architecture(record.architecture_id).create()
        model.load(path.read_bytes())
        self._models[record.id] = model
        return model

    def _save(self, record: Classifier, model: ClassificationModel) -> None:
        self.weights_dir.mkdir(parents=True, exist_ok=True)
        self._weights_path(record.id).write_bytes(model.save())

    def restore(self, record: Classifier, weights: bytes | None) -> Classifier:
        """Puts a record from a project file back, with its weights when
        this engine has the architecture to run them; otherwise the record
        stays but counts as untrained, since nothing here can load it."""
        usable = weights is not None and record.architecture_id in self.engine.models.classifiers
        if usable:
            self.weights_dir.mkdir(parents=True, exist_ok=True)
            self._weights_path(record.id).write_bytes(weights)  # type: ignore[arg-type]
        else:
            record = record.model_copy(update={"trained": False, "busy": None})
        self.meta.put(KIND, record)
        return record

    # ── Items of a target ───────────────────────────────────────────────────

    def _categories(self, target_id: str) -> list[Category]:
        """The target's categories other than unknown, in project order."""
        return [
            category
            for category in self.engine._categories()
            if not represents_unknown(category.id)
            and (
                category.type == "image"
                if target_id == IMAGE_TARGET_ID
                else category.type == "annotation" and category.kind_id == target_id
            )
        ]

    def _unknown_category_id(self, target_id: str) -> str:
        for category in self.engine._categories():
            if represents_unknown(category.id) and (
                category.type == "image"
                if target_id == IMAGE_TARGET_ID
                else category.type == "annotation" and category.kind_id == target_id
            ):
                return category.id
        raise BackendError("NOT_FOUND", f"No unknown category for {target_id}")

    def _items(self, target_id: str) -> tuple[list[LabeledItem], dict[str, Sample]]:
        """Every item of the target with what the split and the dataset need."""
        items: list[LabeledItem] = []
        samples: dict[str, Sample] = {}
        if target_id == IMAGE_TARGET_ID:
            for image in self.meta.list("image", ImageObject):
                items.append(LabeledItem(image.id, image.category_id, image.partition))
                samples[image.id] = image_sample(image)
            return items, samples
        ids = self.meta.select_ids("annotation", where=[MetaStore.in_clause("kind_id", [target_id])])
        headers = self.meta.get_many("annotation", ids, AnnotationHeader)
        volumes = self.meta.get_many(
            "volume", sorted({header.volume_id for header in headers.values()}), AnnotationVolume
        )
        images = self.meta.get_many("image", sorted({h.image_id for h in headers.values()}), ImageObject)
        for id in ids:
            header = headers.get(id)
            volume = volumes.get(header.volume_id) if header else None
            image = images.get(header.image_id) if header else None
            if header is None or volume is None or image is None:
                continue
            items.append(LabeledItem(header.id, volume.category_id, header.partition))
            samples[header.id] = annotation_sample(header, int(image.bit_depth))
        return items, samples

    def _channels(self, samples: list[Sample]) -> dict[str, list[Channel]]:
        """The planes' channels, read here on the loop thread for the dataset."""
        return {
            plane_id: self.meta.list("channel", Channel, parent=plane_id)
            for plane_id in {sample.plane_id for sample in samples}
        }

    def _materialize(self, samples: list[Sample], settings, *, training: bool = False, seed: int = 0):
        channels = self._channels(samples)
        return asyncio.to_thread(
            materialize, self.engine.pixels, samples, channels, settings, training=training, seed=seed
        )

    def _assign_partitions(self, target_id: str, assignments: list[tuple[str, Partition]]) -> None:
        if not assignments:
            return
        wanted = dict(assignments)
        if target_id == IMAGE_TARGET_ID:
            images = self.meta.get_many("image", list(wanted), ImageObject)
            rows = []
            updates: list[ImageUpdate] = []
            for id, partition in wanted.items():
                image = images.get(id)
                if image is None:
                    continue
                updated = image.model_copy(update={"partition": partition})
                rows.append((updated, updated.series_id))
                updates.append(self.engine._image_update(updated))
            self.meta.put_many("image", rows)
            self.engine._emit(ImagesDidUpdate(type="images/didUpdate", updates=updates))
            return
        headers = self.meta.get_many("annotation", list(wanted), AnnotationHeader)
        volumes = self.meta.get_many(
            "volume", sorted({header.volume_id for header in headers.values()}), AnnotationVolume
        )
        rewritten = []
        updates: list[AnnotationUpdate] = []
        for id, partition in wanted.items():
            header = headers.get(id)
            if header is None or header.volume_id not in volumes:
                continue
            rewritten.append(header.model_copy(update={"partition": partition}))
            updates.append(AnnotationUpdate(id=id, partition=partition))
        self.meta.update_many(
            "annotation", rewritten, index={h.id: annotation_index(volumes[h.volume_id]) for h in rewritten}
        )
        self.engine._emit(AnnotationsDidUpdate(type="annotations/didUpdate", volumes=[], annotations=updates))

    def _write_predictions(
        self,
        target_id: str,
        predictions: list[tuple[str, str, float, float]],
        run_id: str,
    ) -> None:
        """``(item id, category id, confidence, margin)`` per item: a
        prediction leaves the partition alone and clears any correction."""
        if not predictions:
            return
        if target_id == IMAGE_TARGET_ID:
            images = self.meta.get_many("image", [p[0] for p in predictions], ImageObject)
            rows = []
            index = {}
            updates: list[ImageUpdate] = []
            for id, category_id, confidence, margin in predictions:
                image = images.get(id)
                if image is None:
                    continue
                updated = image.model_copy(
                    update={
                        "category_id": category_id,
                        "partition": next_partition(category_id, image.partition, True),
                        "prediction_confidence": confidence,
                        "predicted_at_run_id": run_id,
                        "prediction_corrected": None,
                    }
                )
                rows.append((updated, updated.series_id))
                index[id] = {"margin": margin}
                updates.append(self.engine._image_update(updated))
            self.meta.put_many("image", rows, index=index)
            self.engine._emit(ImagesDidUpdate(type="images/didUpdate", updates=updates))
            return
        headers = self.meta.get_many("annotation", [p[0] for p in predictions], AnnotationHeader)
        volumes = self.meta.get_many(
            "volume", sorted({header.volume_id for header in headers.values()}), AnnotationVolume
        )
        changed: dict[str, AnnotationVolume] = {}
        margins: dict[str, float] = {}
        for id, category_id, confidence, margin in predictions:
            header = headers.get(id)
            volume = volumes.get(header.volume_id) if header else None
            if header is None or volume is None:
                continue
            changed[volume.id] = volume.model_copy(
                update={
                    "category_id": category_id,
                    "prediction_confidence": confidence,
                    "predicted_at_run_id": run_id,
                    "prediction_corrected": None,
                }
            )
            margins[volume.id] = margin
        if not changed:
            return
        self.meta.put_many("volume", [(volume, volume.image_id) for volume in changed.values()])
        # Every annotation of a predicted volume carries the margin; partitions stay.
        image_ids = sorted({volume.image_id for volume in changed.values()})
        rewritten = [
            header
            for header in self.meta.list("annotation", AnnotationHeader, parents=image_ids)
            if header.volume_id in changed
        ]
        self.meta.update_many(
            "annotation",
            rewritten,
            index={
                h.id: {**annotation_index(changed[h.volume_id]), "margin": margins[h.volume_id]}
                for h in rewritten
            },
        )
        self.engine._emit(
            AnnotationsDidUpdate(
                type="annotations/didUpdate",
                volumes=[self.engine._volume_update(volume) for volume in changed.values()],
                annotations=[AnnotationUpdate(id=h.id, partition=h.partition) for h in rewritten],
            )
        )

    def _clear_margins(self, target_id: str, ids: list[str]) -> None:
        if not ids:
            return
        if target_id == IMAGE_TARGET_ID:
            images = self.meta.get_many("image", ids, ImageObject)
            self.meta.update_many("image", list(images.values()))
            return
        headers = self.meta.get_many("annotation", ids, AnnotationHeader)
        volumes = self.meta.get_many(
            "volume", sorted({header.volume_id for header in headers.values()}), AnnotationVolume
        )
        rewritten = [h for h in headers.values() if h.volume_id in volumes]
        self.meta.update_many(
            "annotation", rewritten, index={h.id: annotation_index(volumes[h.volume_id]) for h in rewritten}
        )

    def _pending(self, target_id: str) -> list[LabeledItem]:
        """Predicted items not yet accepted or cleared."""
        items, _ = self._items(target_id)
        return [
            item
            for item in items
            if item.partition == Partition.INFERENCE and not represents_unknown(item.category_id)
        ]

    # ── Domain ──────────────────────────────────────────────────────────────

    def list_architectures(self) -> list[ModelDescriptor]:
        return [architecture.describe() for architecture in self.engine.models.classifiers.values()]

    def create(self, request: ClassifierCreateRequest) -> Classifier:
        architecture = self._architecture(request.architecture_id)
        if any(record.name == request.name for record in self.list()):
            raise BackendError("MODEL_CREATE_FAILED", f'A classifier named "{request.name}" already exists')
        seed = request.seed if request.seed is not None else random.randrange(1000)
        record = Classifier(
            id=generate_uuid(),
            target_id=request.target_id,
            name=request.name,
            architecture_id=architecture.id,
            framework=architecture.framework,
            hyperparameters=request.hyperparameters,
            classes=[],
            confidence_threshold=0.5,
            trained=False,
            trainable=True,
            valid=True,
            init_seed=seed,
            runs=[],
        )
        return self._write(record)

    def update(self, request: ClassifierUpdateRequest) -> Classifier:
        record = self.record(request.classifier_id)
        changes: dict = {}
        if request.hyperparameters is not None:
            changes["hyperparameters"] = request.hyperparameters
        if request.class_map is not None:
            changes["class_map"] = request.class_map
        if request.confidence_threshold is not None:
            changes["confidence_threshold"] = min(1.0, max(0.0, request.confidence_threshold))
        return self._write(record.model_copy(update=changes))

    def delete(self, classifier_id: str) -> None:
        self.record(classifier_id)
        self._remove(classifier_id)
        self._announce()

    def kinds_deleted(self, kind_ids: list[str]) -> None:
        """A kind's classifiers go with it: their target no longer exists."""
        targets = set(kind_ids)
        gone = [record for record in self.list() if record.target_id in targets]
        for record in gone:
            self._remove(record.id)
        if gone:
            self._announce()

    def _remove(self, classifier_id: str) -> None:
        self.meta.delete(KIND, [classifier_id])
        self._models.pop(classifier_id, None)
        path = self._weights_path(classifier_id)
        if path.is_file():
            path.unlink()

    async def fit(self, request: ClassifierFitRequest, ctx: HandlerContext) -> ClassifierFitSummary:
        engine = self.engine
        engine._capture_loop()
        record = self.record(request.classifier_id)
        if ctx.cancelled:
            return ClassifierFitSummary(status=RunStatus.STOPPED)
        job = engine.jobs.start(JobKind.CLASSIFIER_FIT, f"Training {record.name}")
        engine._run_contexts[job.id] = ctx
        try:
            summary = await self._fit(job.id, record, request, ctx)
        except RequestCancelled:
            engine.jobs.finish(job.id, JobStatus.CANCELLED)
            raise
        except Exception as error:
            engine.jobs.finish(job.id, JobStatus.FAILED, error=str(error))
            raise
        finally:
            engine._run_contexts.pop(job.id, None)
        engine.jobs.finish(
            job.id,
            JobStatus.CANCELLED if summary.status == RunStatus.STOPPED else JobStatus.SUCCEEDED,
            message=f"Training {summary.status.value}",
        )
        return summary

    async def _fit(
        self, job_id: str, record: Classifier, request: ClassifierFitRequest, ctx: HandlerContext
    ) -> ClassifierFitSummary:
        engine = self.engine
        loop = asyncio.get_running_loop()
        if not record.valid:
            raise BackendError(
                "TRAINING_FAILED", "The categories changed since the last run; create a new classifier"
            )
        preprocess = record.hyperparameters.preprocess
        optimizer = record.hyperparameters.optimizer
        seed = (
            request.seed
            if request.seed is not None
            else record.init_seed
            if record.init_seed is not None
            else random.randrange(1000)
        )
        model = self._model(record)
        fresh = model is None
        categories = self._categories(record.target_id)
        if fresh:
            class_map = {str(index): category.id for index, category in enumerate(categories)}
        elif record.class_map:
            class_map = record.class_map
        else:
            raise BackendError(
                "TRAINING_FAILED", "Map the model's classes to the project's categories before training"
            )
        class_ids = [class_map[key] for key in sorted(class_map, key=int)]
        class_index = {category_id: index for index, category_id in enumerate(class_ids)}

        items, samples = self._items(record.target_id)
        split = split_for_training(
            items,
            SplitOptions(
                training_percentage=preprocess.training_percentage,
                shuffle=preprocess.shuffle,
                seed=seed,
                continued=not fresh,
            ),
        )
        if not split.training or not split.validation:
            raise BackendError(
                "PREPROCESS_FAILED",
                "Cannot train: need at least one training and one validation item "
                f"(got {len(split.training)} training, {len(split.validation)} validation). "
                "Label more items or adjust the training percentage.",
            )
        unknown_classes = {item.category_id for item in [*split.training, *split.validation]} - set(class_index)
        if unknown_classes:
            raise BackendError(
                "TRAINING_FAILED", "Some labeled items are in categories the classifier does not know"
            )
        self._assign_partitions(record.target_id, split.assignments)

        training_fingerprint = fingerprint_items((it.id, it.category_id) for it in split.training)
        validation_fingerprint = fingerprint_items((it.id, it.category_id) for it in split.validation)
        parent = next((run for run in reversed(record.runs) if run.status != RunStatus.IN_PROGRESS), None)

        def progress(percent: float, message: str) -> None:
            ctx.progress(ProgressValue(percent=percent, message=message).to_wire())
            engine.jobs.update(job_id, progress=percent, message=message)

        progress(-1, f"Preparing {len(split.training) + len(split.validation)} items")
        x = await self._materialize([samples[it.id] for it in split.training], preprocess, training=True, seed=seed)
        y = repeat_labels(
            np.array([class_index[it.category_id] for it in split.training], dtype=np.int64),
            preprocess,
            training=True,
        )
        val_x = await self._materialize([samples[it.id] for it in split.validation], preprocess)
        val_y = np.array([class_index[it.category_id] for it in split.validation], dtype=np.int64)
        ctx.check_cancelled()

        if model is None:
            model = self._architecture(record.architecture_id).create()
            # A plugin's environment may still have to be built; its phases
            # show in the job, and a cancel is honoured once it is done.
            await asyncio.to_thread(model.prepare, lambda message, percent: progress(percent, message))
            ctx.check_cancelled()
            await asyncio.to_thread(model.build, len(class_ids), preprocess.input_shape, seed)
            self._models[record.id] = model

        trained_ids = {it.id for it in split.training}
        corrected = any(
            sample.id in trained_ids and parent is not None and corrected_from == parent.id
            for sample, corrected_from in self._corrections(record.target_id)
        )
        trigger = (
            RunTrigger.FRESH if fresh else RunTrigger.HITL_CORRECTION if corrected else RunTrigger.CONTINUE
        )
        run = Run(
            id=generate_uuid(),
            parent_run_id=parent.id if parent else None,
            started_at=_now(),
            status=RunStatus.IN_PROGRESS,
            trigger=trigger,
            seed=seed,
            app_version=f"piximi-engine {engine.version}",
            framework_version=model.framework_version,
            device=model.device,
            hyperparameters=RunHyperparameterSnapshot(
                architecture=record.architecture_id, optimizer=optimizer, preprocess=preprocess
            ),
            class_map=class_map,
            training_fingerprint=training_fingerprint,
            validation_fingerprint=validation_fingerprint,
            val_ids=[it.id for it in split.validation],
            category_set_hash=hash_category_set(category.id for category in categories),
            history=[],
        )
        record = self._write(
            record.model_copy(
                update={
                    "class_map": class_map,
                    "classes": [category.name for category in categories],
                    "init_seed": record.init_seed if record.init_seed is not None else seed,
                    "busy": ClassifierActivity.TRAINING,
                    "runs": [*record.runs, run],
                }
            )
        )

        total = max(1, int(optimizer.epochs))

        def report(epoch: RunHistoryEpoch) -> None:
            # Called on the training thread; the store and the loop stay on theirs.
            loop.call_soon_threadsafe(self._epoch, record.id, run.id, epoch, job_id, total, ctx)

        def cancelled() -> bool:
            return ctx.cancelled or engine.jobs.is_cancelling(job_id)

        status: RunStatus
        eval_results: EvaluationResult | None = None
        try:
            status = await asyncio.to_thread(model.fit, x, y, val_x, val_y, optimizer, report, cancelled)
            eval_results = evaluate(model.predict(val_x), val_y, len(class_ids))
            self._save(record, model)
        except Exception:
            self._finalize(record.id, run.id, RunStatus.FAILED, None, None)
            raise
        self._finalize(record.id, run.id, status, eval_results, model.summary())
        return ClassifierFitSummary(job_id=job_id, run_id=run.id, status=status, eval_results=eval_results)

    def _corrections(self, target_id: str) -> list[tuple[Sample, str]]:
        """``(sample, run id the user corrected)`` for items with a correction."""
        found: list[tuple[Sample, str]] = []
        if target_id == IMAGE_TARGET_ID:
            for image in self.meta.list("image", ImageObject):
                if image.prediction_corrected is not None:
                    found.append((image_sample(image), image.prediction_corrected.corrected_from_run_id))
            return found
        ids = self.meta.select_ids("annotation", where=[MetaStore.in_clause("kind_id", [target_id])])
        headers = self.meta.get_many("annotation", ids, AnnotationHeader)
        volumes = self.meta.get_many(
            "volume", sorted({header.volume_id for header in headers.values()}), AnnotationVolume
        )
        for header in headers.values():
            volume = volumes.get(header.volume_id)
            if volume is not None and volume.prediction_corrected is not None:
                found.append((annotation_sample(header, 8), volume.prediction_corrected.corrected_from_run_id))
        return found

    def _epoch(
        self,
        classifier_id: str,
        run_id: str,
        epoch: RunHistoryEpoch,
        job_id: str,
        total: int,
        ctx: HandlerContext,
    ) -> None:
        record = self.meta.get(KIND, classifier_id, Classifier)
        if record is None:
            return
        runs = [
            run.model_copy(update={"history": [*run.history, epoch]}) if run.id == run_id else run
            for run in record.runs
        ]
        self.meta.put(KIND, record.model_copy(update={"runs": runs}))
        self.engine._emit(
            ClassifiersDidEpoch(type="classifiers/didEpoch", classifier_id=classifier_id, run_id=run_id, epoch=epoch)
        )
        percent = round((epoch.epoch + 1) / total * 100)
        message = f"Epoch {epoch.epoch + 1} of {total}"
        ctx.progress(ProgressValue(percent=percent, message=message).to_wire())
        self.engine.jobs.update(job_id, progress=percent, message=message)

    def _finalize(
        self,
        classifier_id: str,
        run_id: str,
        status: RunStatus,
        eval_results: EvaluationResult | None,
        summary,
    ) -> None:
        record = self.record(classifier_id)
        runs = [
            run.model_copy(update={"status": status, "finished_at": _now(), "eval_results": eval_results})
            if run.id == run_id
            else run
            for run in record.runs
        ]
        self._write(
            record.model_copy(
                update={
                    "runs": runs,
                    "busy": None,
                    "trained": record.trained or status != RunStatus.FAILED,
                    **({"summary": summary} if summary is not None else {}),
                }
            )
        )

    async def predict(self, request: ClassifierPredictRequest, ctx: HandlerContext) -> ClassifierPredictSummary:
        engine = self.engine
        engine._capture_loop()
        record = self.record(request.classifier_id)
        if ctx.cancelled:
            return ClassifierPredictSummary(predicted=0, cancelled=True)
        job = engine.jobs.start(JobKind.CLASSIFIER_PREDICT, f"Predicting with {record.name}", cancellable=False)
        try:
            predicted = await self._predict(job.id, record, request, ctx)
        except Exception as error:
            engine.jobs.finish(job.id, JobStatus.FAILED, error=str(error))
            raise
        engine.jobs.finish(job.id, JobStatus.SUCCEEDED, message=f"Predicted {predicted} items")
        return ClassifierPredictSummary(job_id=job.id, predicted=predicted, cancelled=False)

    async def _predict(
        self, job_id: str, record: Classifier, request: ClassifierPredictRequest, ctx: HandlerContext
    ) -> int:
        engine = self.engine
        if not record.class_map:
            raise BackendError(
                "PREDICTION_FAILED", "Map the model's classes to the project's categories before predicting"
            )
        run = record.runs[-1] if record.runs else None
        model = self._model(record)
        if run is None or model is None:
            raise BackendError("PREDICTION_FAILED", "The classifier has no run")
        class_ids = [record.class_map[key] for key in sorted(record.class_map, key=int)]
        # A deleted category would otherwise come back as a dangling prediction.
        known = {category.id for category in self._categories(record.target_id)}
        if any(category_id not in known for category_id in class_ids):
            raise BackendError(
                "PREDICTION_FAILED", "The categories changed since the last run; create a new classifier"
            )
        wanted = set(request.ids) if request.ids is not None else None
        items, samples = self._items(record.target_id)
        targets = [
            item
            for item in items
            if represents_unknown(item.category_id) and (wanted is None or item.id in wanted)
        ]
        if not targets:
            return 0

        def progress(percent: float, message: str) -> None:
            ctx.progress(ProgressValue(percent=percent, message=message).to_wire())
            engine.jobs.update(job_id, progress=percent, message=message)

        self._write(record.model_copy(update={"busy": ClassifierActivity.PREDICTING}))
        try:
            progress(-1, f"Preparing {len(targets)} items")
            x = await self._materialize([samples[it.id] for it in targets], record.hyperparameters.preprocess)
            progress(-1, "Predicting")
            probabilities = await asyncio.to_thread(model.predict, x)
            predictions = [
                (item.id, class_ids[int(row.argmax())], float(row.max()), _margin(row))
                for item, row in zip(targets, probabilities)
            ]
            self._write_predictions(record.target_id, predictions, run.id)
        finally:
            self._write(self.record(record.id).model_copy(update={"busy": None}))
        return len(targets)

    async def evaluate(self, classifier_id: str) -> EvaluationResult:
        record = self.record(classifier_id)
        run = record.runs[-1] if record.runs else None
        model = self._model(record)
        if run is None or model is None or not record.class_map:
            raise BackendError("EVALUATION_FAILED", "The classifier has no run")
        class_ids = [record.class_map[key] for key in sorted(record.class_map, key=int)]
        class_index = {category_id: index for index, category_id in enumerate(class_ids)}
        items, samples = self._items(record.target_id)
        validation = [
            it for it in items if it.partition == Partition.VALIDATION and it.category_id in class_index
        ]
        if not validation:
            raise BackendError("EVALUATION_FAILED", "Cannot evaluate model on empty validation set.")
        self._write(record.model_copy(update={"busy": ClassifierActivity.EVALUATING}))
        try:
            val_x = await self._materialize([samples[it.id] for it in validation], record.hyperparameters.preprocess)
            val_y = np.array([class_index[it.category_id] for it in validation], dtype=np.int64)
            result = evaluate(await asyncio.to_thread(model.predict, val_x), val_y, len(class_ids))
            latest = self.record(record.id)
            self._write(
                latest.model_copy(
                    update={
                        "busy": None,
                        "runs": [
                            r.model_copy(update={"eval_results": result}) if r.id == run.id else r
                            for r in latest.runs
                        ],
                    }
                )
            )
            return result
        except Exception:
            self._write(self.record(record.id).model_copy(update={"busy": None}))
            raise

    async def accept_predictions(self, target_id: str) -> ChangedResult:
        pending = self._pending(target_id)
        self._assign_partitions(target_id, [(item.id, Partition.UNASSIGNED) for item in pending])
        self._clear_margins(target_id, [item.id for item in pending])
        return ChangedResult(changed=len(pending))

    async def clear_predictions(self, target_id: str) -> ChangedResult:
        pending = self._pending(target_id)
        unknown = self._unknown_category_id(target_id)
        ids = [item.id for item in pending]
        if target_id == IMAGE_TARGET_ID:
            from piximi_schema.query import ImageQuery  # noqa: PLC0415

            await self.engine.images_categorize(ImageQuery(ids=ids), unknown)
        else:
            from piximi_schema.query import AnnotationQuery  # noqa: PLC0415

            await self.engine.annotations_categorize(AnnotationQuery(ids=ids), unknown)
        self._clear_margins(target_id, ids)
        return ChangedResult(changed=len(pending))

    # ── Archives ────────────────────────────────────────────────────────────

    def export(self, classifier_id: str) -> ClassifierExportResult:
        record = self.record(classifier_id)
        model = self._model(record)
        if model is None:
            raise BackendError("MODEL_NOT_FOUND", "The classifier has not been trained")
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as archive:
            archive.writestr(
                MANIFEST_FILE,
                json.dumps(
                    {
                        "formatVersion": MANIFEST_VERSION,
                        "savedAt": _now(),
                        "modelName": record.name,
                        "framework": record.framework,
                        "architectureId": record.architecture_id,
                        "protocolVersion": PROTOCOL_VERSION,
                        "classifier": record.model_copy(update={"busy": None}).to_wire(),
                        "files": {"modelWeights": WEIGHTS_FILE, "runHistory": RUNS_FILE},
                    }
                ),
            )
            archive.writestr(WEIGHTS_FILE, model.save())
            archive.writestr(RUNS_FILE, json.dumps([run.to_wire() for run in record.runs]))
        return ClassifierExportResult(
            file_name=f"{record.name}.zip", mime="application/zip", data=buffer.getvalue()
        )

    def import_(self, request: ClassifierImportRequest) -> Classifier:
        try:
            archive = zipfile.ZipFile(io.BytesIO(request.data))
            manifest = json.loads(archive.read(MANIFEST_FILE))
        except (zipfile.BadZipFile, KeyError, ValueError) as error:
            raise BackendError("INVALID_FILE_FORMAT", f"Not a classifier archive: {error}") from error
        if "classifier" not in manifest:
            raise BackendError(
                "NOT_SUPPORTED", "This archive holds a browser (tfjs) model, which only the in-browser backend can load"
            )
        source = Classifier.model_validate(manifest["classifier"])
        architecture = self._architecture(source.architecture_id)
        name = request.name or source.name
        if any(record.name == name for record in self.list()):
            raise BackendError("MODEL_CREATE_FAILED", f'A classifier named "{name}" already exists')
        model = architecture.create()
        model.load(archive.read(manifest["files"]["modelWeights"]))
        record = source.model_copy(
            update={
                "id": generate_uuid(),
                "name": name,
                "target_id": request.target_id,
                "busy": None,
                # The archive's categories exist here only by coincidence.
                "class_map": self._reusable_class_map(source, request.target_id),
            }
        )
        self._models[record.id] = model
        self._save(record, model)
        return self._write(record)

    def _reusable_class_map(self, source: Classifier, target_id: str) -> dict[str, str] | None:
        known = {category.id for category in self._categories(target_id)}
        class_map = source.class_map or (source.runs[-1].class_map if source.runs else None)
        if class_map and len(class_map) == len(source.classes) and set(class_map.values()) <= known:
            return class_map
        return None
