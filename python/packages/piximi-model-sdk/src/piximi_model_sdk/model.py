from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Callable, Optional, Sequence, Union

import numpy as np


class Cancelled(Exception):
    """Raised by :meth:`Context.check_cancelled` once the caller gave up."""


class Context:
    """What a model gets while it loads or segments: a way to report
    progress, and a way to learn that the caller cancelled.

    Cancellation is cooperative. A model doing work in steps calls
    :meth:`check_cancelled` between them; nothing can interrupt it
    otherwise.
    """

    def __init__(
        self,
        report: Optional[Callable[[Optional[str], Optional[float]], None]] = None,
        cancelled: Optional[Callable[[], bool]] = None,
        report_epoch: Optional[Callable[[dict], None]] = None,
    ) -> None:
        self._report = report
        self._cancelled = cancelled
        self._report_epoch = report_epoch

    def progress(self, message: Optional[str] = None, percent: Optional[float] = None) -> None:
        """Reports progress: ``percent`` is 0..100, or None while indeterminate."""
        if self._report is not None:
            self._report(message, percent)

    def epoch(
        self, epoch: int, loss: float, val_loss: float, accuracy: float, val_accuracy: float
    ) -> None:
        """Reports one finished training epoch; the engine records it on the
        run and every connected client plots it."""
        if self._report_epoch is not None:
            self._report_epoch(
                {
                    "epoch": int(epoch),
                    "loss": float(loss),
                    "valLoss": float(val_loss),
                    "accuracy": float(accuracy),
                    "valAccuracy": float(val_accuracy),
                }
            )

    @property
    def cancelled(self) -> bool:
        return bool(self._cancelled()) if self._cancelled is not None else False

    def check_cancelled(self) -> None:
        if self.cancelled:
            raise Cancelled()


@dataclass
class LabelResult:
    labels: np.ndarray
    """A 2-D integer label image: 0 is background, each object is one label."""
    classes: Optional[Sequence[str]] = None
    """For a model whose output policy is ``classes``: ``classes[i]`` names
    the kind of label ``i + 1``. Left out, every object lands in the kind
    the user named."""


Segmentation = Union[np.ndarray, LabelResult]


class SegmentationModel:
    """One model of a plugin. The manifest describes it; this runs it.

    The engine creates the instance named by the manifest's ``attribute``
    in the plugin's environment, calls :meth:`load` once before the first
    use, then :meth:`segment` per image.
    """

    settings: dict[str, Any] = {}
    """The engine's preferences, set before :meth:`load`: ``gpu`` (bool),
    whether to use a GPU when there is one."""

    def load(self, ctx: Context) -> None:
        """Fetches weights and warms up. A no-op for models with nothing to load."""

    def segment(self, image: np.ndarray, options: dict[str, Any], ctx: Context) -> Segmentation:
        """Segments one plane.

        ``image`` is ``(C, Y, X)`` in the source's dtype (uint8 or uint16),
        its channels in the order the user mapped them to the model's
        inputs (see the manifest's channel policy). ``options`` holds the
        values of the manifest's option fields, defaults filled in, with an
        optional field left empty absent.

        Returns a label image the size of the plane, or a
        :class:`LabelResult` to name a kind per object.
        """
        raise NotImplementedError

    def unload(self) -> None:
        """Frees what :meth:`load` claimed, e.g. GPU memory."""


class ClassificationModel:
    """A classifier architecture of a plugin: the engine builds one instance
    per classifier the user creates, trains it on arrays it prepared, and
    keeps its weights through ``save``/``load``.

    Arrays are ``(N, C, H, W)`` float32 (already scaled to 0..1 when the
    user asked for normalization); labels are ``(N,)`` class indices.
    ``options`` carries the user's optimizer settings as the frontend names
    them: ``learningRate``, ``epochs``, ``batchSize``, ``optimizationAlgorithm``,
    ``lossFunction``.
    """

    settings: dict[str, Any] = {}
    """The engine's preferences, set before :meth:`build`: ``gpu`` (bool)."""
    device: str = "cpu"
    """Where the model trains, e.g. ``cuda:0``; shown on each run."""
    framework_version: str = ""

    def build(self, num_classes: int, input_shape: tuple[int, int, int], seed: int) -> None:
        """Creates fresh weights for ``num_classes`` outputs over
        ``(channels, height, width)`` inputs; ``seed`` makes them repeatable."""
        raise NotImplementedError

    def fit(
        self,
        x: np.ndarray,
        y: np.ndarray,
        val_x: np.ndarray,
        val_y: np.ndarray,
        options: dict[str, Any],
        ctx: Context,
    ) -> None:
        """Trains for ``options["epochs"]`` more epochs, calling
        :meth:`Context.epoch` after each and returning early once
        ``ctx.cancelled`` is set (a run stopped by the user keeps the epochs
        so far)."""
        raise NotImplementedError

    def predict(self, x: np.ndarray) -> np.ndarray:
        """``(N, num_classes)`` class probabilities."""
        raise NotImplementedError

    def save(self) -> bytes:
        """The weights, in whatever form :meth:`load` reads back."""
        raise NotImplementedError

    def load(self, data: bytes) -> None:
        raise NotImplementedError

    def summary(self) -> Optional[list[dict[str, Any]]]:
        """The layer table shown in the app: dicts with ``layerName``,
        ``outputShape``, ``parameters`` and ``trainable``; None for none."""
        return None

    def unload(self) -> None:
        """Frees what :meth:`build` or :meth:`load` claimed."""
