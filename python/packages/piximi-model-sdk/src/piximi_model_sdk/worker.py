"""The engine's side of a plugin, run inside the plugin's environment.

The engine runs an Appose worker in the environment and sends it short
task scripts that call the functions here: instantiate a model, load it,
segment an image. Images and label images cross as Appose ``NDArray``\\ s
in named shared memory, so no pixel is serialized; only the array's name,
shape and dtype travel over the worker's pipe.

The ``task`` argument is Appose's worker-side task object, which carries
progress back (``update``) and the caller's cancellation
(``cancel_requested``).
"""

from __future__ import annotations

import base64
import importlib
import platform
import sys
from typing import Any, Optional

import numpy as np

from .model import Cancelled, ClassificationModel, Context, LabelResult, SegmentationModel

_models: dict[str, SegmentationModel | ClassificationModel] = {}


def instantiate(
    key: str, module: str, attribute: str, settings: Optional[dict[str, Any]] = None
) -> dict[str, str]:
    """Imports the plugin's entry module and keeps the model it names under
    ``key``; the attribute may be the instance, its class, or a factory."""
    target = getattr(importlib.import_module(module), attribute)
    kinds = (SegmentationModel, ClassificationModel)
    model = target() if not isinstance(target, kinds) and callable(target) else target
    if not isinstance(model, kinds):
        raise TypeError(f"{module}:{attribute} is not a SegmentationModel or ClassificationModel")
    model.settings = dict(settings or {})
    _models[key] = model
    return {"python": platform.python_version(), "executable": sys.executable}


def _context(task: Any) -> Context:
    def report(message: Optional[str], percent: Optional[float]) -> None:
        if percent is None:
            task.update(message=message)
        else:
            task.update(message=message, current=int(round(percent)), maximum=100)

    def report_epoch(epoch: dict) -> None:
        # Structured, so the engine records it rather than parsing a message.
        task.update(message=f"Epoch {epoch['epoch'] + 1}", info={"epoch": epoch})

    return Context(report, lambda: bool(task.cancel_requested), report_epoch)


def _classifier(key: str) -> ClassificationModel:
    model = _models[key]
    if not isinstance(model, ClassificationModel):
        raise TypeError(f"{key} is not a ClassificationModel")
    return model


def load(task: Any, key: str) -> None:
    try:
        _models[key].load(_context(task))
    except Cancelled:
        task.cancel()


def unload(key: str) -> None:
    model = _models.pop(key, None)
    if model is not None:
        model.unload()


def segment(task: Any, key: str, image: Any, options: Optional[dict[str, Any]]) -> Optional[dict[str, Any]]:
    """Runs the model on ``image`` (an ``NDArray``) and returns the task
    outputs: ``labels`` as a new ``NDArray`` the engine releases, plus
    ``classes`` when the model named them."""
    from appose import NDArray  # the plugin environment's appose

    model = _models[key]
    data = np.asarray(image)  # a view onto the shared memory, no copy
    try:
        result = model.segment(data, dict(options or {}), _context(task))
    except Cancelled:
        task.cancel()
        return None
    finally:
        del data
        try:
            image.shm.close()
        except BufferError:
            # The model kept a view alive; the engine still unlinks the block.
            pass
    labels, classes = (result.labels, result.classes) if isinstance(result, LabelResult) else (result, None)
    labels = np.asarray(labels)
    if labels.ndim != 2:
        raise ValueError(f"segment() must return a 2-D label image, got shape {labels.shape}")
    if labels.dtype.kind not in "iub":
        raise TypeError(f"segment() must return an integer label image, got {labels.dtype}")
    outputs: dict[str, Any] = {"labels": NDArray.copy_of(np.ascontiguousarray(labels.astype(np.int32, copy=False)))}
    if classes is not None:
        outputs["classes"] = [str(name) for name in classes]
    return outputs


# ── Classifiers ─────────────────────────────────────────────────────────────
#
# Training sets can exceed what one shared-memory block should hold, so the
# engine writes them as ``.npy`` files beside its data and sends the paths;
# the worker maps them without copying. Probabilities come back in shared
# memory, like labels do.


def _about(model: ClassificationModel) -> dict[str, Any]:
    return {
        "device": model.device,
        "frameworkVersion": model.framework_version,
        "summary": model.summary(),
    }


def build(key: str, num_classes: int, input_shape: list[int], seed: int) -> dict[str, Any]:
    model = _classifier(key)
    model.build(int(num_classes), tuple(int(v) for v in input_shape), int(seed))
    return _about(model)


def fit(
    task: Any,
    key: str,
    x: str,
    y: str,
    val_x: str,
    val_y: str,
    options: Optional[dict[str, Any]],
) -> dict[str, Any]:
    model = _classifier(key)
    ctx = _context(task)
    try:
        model.fit(
            np.load(x, mmap_mode="r"),
            np.load(y, mmap_mode="r"),
            np.load(val_x, mmap_mode="r"),
            np.load(val_y, mmap_mode="r"),
            dict(options or {}),
            ctx,
        )
    except Cancelled:
        return {"status": "stopped", **_about(model)}
    return {"status": "stopped" if ctx.cancelled else "completed", **_about(model)}


def predict(key: str, x: str) -> dict[str, Any]:
    from appose import NDArray  # the plugin environment's appose

    probabilities = np.asarray(_classifier(key).predict(np.load(x, mmap_mode="r")), dtype=np.float32)
    if probabilities.ndim != 2:
        raise ValueError(f"predict() must return (N, classes) probabilities, got shape {probabilities.shape}")
    return {"probabilities": NDArray.copy_of(np.ascontiguousarray(probabilities))}


def save_weights(key: str) -> dict[str, str]:
    return {"data": base64.b64encode(_classifier(key).save()).decode("ascii")}


def load_weights(key: str, data: str) -> dict[str, Any]:
    model = _classifier(key)
    model.load(base64.b64decode(data))
    return _about(model)
