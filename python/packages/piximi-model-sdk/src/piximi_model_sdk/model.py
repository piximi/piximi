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
    ) -> None:
        self._report = report
        self._cancelled = cancelled

    def progress(self, message: Optional[str] = None, percent: Optional[float] = None) -> None:
        """Reports progress: ``percent`` is 0..100, or None while indeterminate."""
        if self._report is not None:
            self._report(message, percent)

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
