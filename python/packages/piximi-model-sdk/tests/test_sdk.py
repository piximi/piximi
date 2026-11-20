"""The SDK's worker-side glue, driven with a stand-in for Appose's task."""

import numpy as np
import pytest

from piximi_model_sdk import Cancelled, ClassificationModel, Context, LabelResult, SegmentationModel
from piximi_model_sdk import worker


class FakeTask:
    def __init__(self, cancel_requested: bool = False) -> None:
        self.cancel_requested = cancel_requested
        self.updates: list[dict] = []
        self.cancelled = False

    def update(self, message=None, current=None, maximum=None, info=None):
        self.updates.append({"message": message, "current": current, "maximum": maximum})

    def cancel(self):
        self.cancelled = True


class Squares(SegmentationModel):
    def __init__(self) -> None:
        self.loaded = False

    def load(self, ctx: Context) -> None:
        ctx.progress("warming", 50)
        ctx.check_cancelled()
        self.loaded = True

    def segment(self, image, options, ctx):
        ctx.check_cancelled()
        labels = (image[0] > options.get("threshold", 0)).astype(np.int64)
        if options.get("classes"):
            return LabelResult(labels, classes=["Bright"])
        return labels


def test_context_reports_and_checks_cancellation():
    reports = []
    ctx = Context(lambda m, p: reports.append((m, p)), lambda: True)
    ctx.progress("step", 10)
    assert reports == [("step", 10)]
    assert ctx.cancelled
    with pytest.raises(Cancelled):
        ctx.check_cancelled()
    assert Context().cancelled is False


def test_instantiate_accepts_instances_classes_and_factories(monkeypatch):
    import types

    module = types.ModuleType("fake_plugin")
    module.INSTANCE = Squares()
    module.CLASS = Squares
    module.factory = lambda: Squares()
    monkeypatch.setitem(__import__("sys").modules, "fake_plugin", module)

    for attribute in ("INSTANCE", "CLASS", "factory"):
        info = worker.instantiate("m", "fake_plugin", attribute, {"gpu": False})
        assert isinstance(worker._models["m"], Squares)
        assert worker._models["m"].settings == {"gpu": False}
        assert info["python"]
    with pytest.raises(TypeError):
        module.NOPE = object()
        worker.instantiate("m", "fake_plugin", "NOPE")


def test_load_reports_progress_and_cancels_cooperatively():
    worker._models["m"] = Squares()
    task = FakeTask()
    worker.load(task, "m")
    assert worker._models["m"].loaded
    assert task.updates == [{"message": "warming", "current": 50, "maximum": 100}]

    worker._models["m"] = Squares()
    task = FakeTask(cancel_requested=True)
    worker.load(task, "m")
    assert task.cancelled and not worker._models["m"].loaded


def test_segment_passes_arrays_through_shared_memory():
    appose = pytest.importorskip("appose")
    worker._models["m"] = Squares()
    image = np.zeros((1, 4, 5), dtype=np.uint16)
    image[0, 1:3, 1:4] = 900
    shared = appose.NDArray.copy_of(image)
    try:
        outputs = worker.segment(FakeTask(), "m", shared, {"threshold": 100, "classes": True})
        assert outputs is not None and outputs["classes"] == ["Bright"]
        labels = np.array(outputs["labels"])
        assert labels.dtype == np.int32 and labels.shape == (4, 5)
        assert labels.sum() == 6
        outputs["labels"].shm.unlink_on_dispose(True)
        outputs["labels"].shm.dispose()
    finally:
        shared.shm.dispose()

    worker._models["m"] = Squares()
    shared = appose.NDArray.copy_of(image)
    try:
        task = FakeTask(cancel_requested=True)
        assert worker.segment(task, "m", shared, {}) is None and task.cancelled
    finally:
        shared.shm.dispose()

    worker.unload("m")
    assert "m" not in worker._models


class Counting(ClassificationModel):
    """Predicts the class seen most in training, enough to drive the tasks."""

    framework_version = "fake 1"
    device = "none"

    def __init__(self) -> None:
        self.counts = None

    def build(self, num_classes, input_shape, seed):
        self.counts = np.zeros(num_classes)

    def fit(self, x, y, val_x, val_y, options, ctx):
        for epoch in range(int(options["epochs"])):
            if ctx.cancelled:
                return
            for label in y:
                self.counts[label] += 1
            ctx.epoch(epoch, 1 / (epoch + 1), 1, 0.5, 0.5)

    def predict(self, x):
        probabilities = self.counts / max(1, self.counts.sum())
        return np.tile(probabilities, (len(x), 1))

    def save(self):
        return self.counts.astype(np.int64).tobytes()

    def load(self, data):
        self.counts = np.frombuffer(data, dtype=np.int64).astype(float)

    def summary(self):
        return [{"layerName": "counts", "outputShape": str(len(self.counts)), "parameters": 0, "trainable": False}]


def test_classifier_tasks_round_trip(tmp_path):
    worker._models["c"] = Counting()
    about = worker.build("c", 2, [1, 2, 2], 0)
    assert about["device"] == "none" and about["summary"][0]["layerName"] == "counts"

    x = np.zeros((4, 1, 2, 2), dtype=np.float32)
    y = np.array([0, 1, 1, 1])
    paths = {}
    for name, array in (("x", x), ("y", y), ("val_x", x[:1]), ("val_y", y[:1])):
        paths[name] = str(tmp_path / f"{name}.npy")
        np.save(paths[name], array)
    task = FakeTask()
    result = worker.fit(task, "c", paths["x"], paths["y"], paths["val_x"], paths["val_y"], {"epochs": 2})
    assert result["status"] == "completed"
    epochs = [u for u in task.updates if u["message"].startswith("Epoch")]
    assert len(epochs) == 2

    saved = worker.save_weights("c")["data"]
    worker._models["d"] = Counting()
    worker.load_weights("d", saved)
    assert list(worker._models["d"].counts) == [2, 6]

    # Cancellation between epochs ends the run as stopped.
    cancelled = FakeTask(cancel_requested=True)
    assert worker.fit(cancelled, "c", paths["x"], paths["y"], paths["val_x"], paths["val_y"], {"epochs": 2})["status"] == "stopped"
