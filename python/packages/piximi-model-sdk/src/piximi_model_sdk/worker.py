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

import importlib
import platform
import sys
from typing import Any, Optional

import numpy as np

from .model import Cancelled, Context, LabelResult, SegmentationModel

_models: dict[str, SegmentationModel] = {}


def instantiate(key: str, module: str, attribute: str) -> dict[str, str]:
    """Imports the plugin's entry module and keeps the model it names under
    ``key``; the attribute may be the instance, its class, or a factory."""
    target = getattr(importlib.import_module(module), attribute)
    model = target() if not isinstance(target, SegmentationModel) and callable(target) else target
    if not isinstance(model, SegmentationModel):
        raise TypeError(f"{module}:{attribute} is not a SegmentationModel")
    _models[key] = model
    return {"python": platform.python_version(), "executable": sys.executable}


def _context(task: Any) -> Context:
    def report(message: Optional[str], percent: Optional[float]) -> None:
        if percent is None:
            task.update(message=message)
        else:
            task.update(message=message, current=int(round(percent)), maximum=100)

    return Context(report, lambda: bool(task.cancel_requested))


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
