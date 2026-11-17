"""Binary run-length encoding, byte-compatible with the frontend's
``src/utils/image/rle.ts``: run lengths over the row-major mask, alternating
background and foreground, starting with background (so a mask that begins
with foreground starts with a ``0`` run)."""

from __future__ import annotations

import numpy as np


def encode_mask(mask: np.ndarray) -> list[int]:
    flat = np.asarray(mask).reshape(-1).astype(bool)
    if flat.size == 0:
        return []
    runs: list[int] = [0] if flat[0] else []
    changes = np.flatnonzero(flat[1:] != flat[:-1]) + 1
    bounds = np.concatenate(([0], changes, [flat.size]))
    runs.extend(np.diff(bounds).tolist())
    return runs


def decode_mask(runs: list[int], shape: tuple[int, int]) -> np.ndarray:
    total = shape[0] * shape[1]
    flat = np.zeros(total, dtype=bool)
    position = 0
    foreground = False
    for run in runs:
        if foreground:
            flat[position : position + run] = True
        position += run
        foreground = not foreground
    if position != total:
        raise ValueError(f"Runs cover {position} pixels, mask has {total}")
    return flat.reshape(shape)
