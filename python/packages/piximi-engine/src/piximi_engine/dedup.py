"""Duplicate detection by mask IoU, as the frontend's ``utils/iouUtils``:
a prediction that overlaps an existing object of the same kind at or above
the threshold is dropped."""

from __future__ import annotations

import numpy as np

from .rle import decode_mask

DUPLICATE_IOU_THRESHOLD = 0.5

BBox = tuple[int, int, int, int]


class MaskedBox:
    """A mask positioned on its plane, decoded lazily and at most once."""

    def __init__(self, bbox: BBox, runs: list[int] | None = None, mask: np.ndarray | None = None):
        self.bbox = bbox
        self._runs = runs
        self._mask = mask

    @property
    def mask(self) -> np.ndarray:
        if self._mask is None:
            x0, y0, x1, y1 = self.bbox
            self._mask = decode_mask(self._runs or [], (y1 - y0, x1 - x0))
        return self._mask


def mask_iou(a: MaskedBox, b: MaskedBox) -> float:
    ax0, ay0, ax1, ay1 = a.bbox
    bx0, by0, bx1, by1 = b.bbox
    x0, y0, x1, y1 = max(ax0, bx0), max(ay0, by0), min(ax1, bx1), min(ay1, by1)
    if x1 <= x0 or y1 <= y0:
        return 0.0
    a_crop = a.mask[y0 - ay0 : y1 - ay0, x0 - ax0 : x1 - ax0]
    b_crop = b.mask[y0 - by0 : y1 - by0, x0 - bx0 : x1 - bx0]
    intersection = float(np.logical_and(a_crop, b_crop).sum())
    if intersection == 0:
        return 0.0
    union = float(a.mask.sum()) + float(b.mask.sum()) - intersection
    return intersection / union if union > 0 else 0.0


def is_duplicate(candidate: MaskedBox, existing: list[MaskedBox]) -> bool:
    return any(mask_iou(candidate, other) >= DUPLICATE_IOU_THRESHOLD for other in existing)
