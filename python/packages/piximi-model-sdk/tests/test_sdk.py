"""The SDK's worker-side glue, driven with a stand-in for Appose's task."""

import numpy as np
import pytest

from piximi_model_sdk import Cancelled, Context, LabelResult, SegmentationModel
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
