"""Reads image files into one or more planes of ``(C, Y, X)`` integer arrays.

Covers what the first slice needs: 2D images with up to a handful of
channels, in TIFF (via tifffile) or any format imageio reads (PNG, JPEG).
Multi-plane stacks become several planes; anything deeper takes its first
volume.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import imageio.v3 as iio
import numpy as np
import tifffile

SUPPORTED_SUFFIXES = {".tif", ".tiff", ".png", ".jpg", ".jpeg", ".bmp"}

# Dimensions this small are channels, not z or t.
MAX_CHANNELS = 16


@dataclass
class DecodedImage:
    planes: list[np.ndarray]
    """One ``(C, Y, X)`` array per plane, uint8 or uint16."""
    bit_depth: int

    @property
    def channels(self) -> int:
        return self.planes[0].shape[0]

    @property
    def shape(self) -> tuple[int, int]:
        return self.planes[0].shape[1:]


def _to_integer(array: np.ndarray) -> tuple[np.ndarray, int]:
    """Normalizes to uint8 or uint16, returning the array and its bit depth."""
    if array.dtype == np.uint8:
        return array, 8
    if array.dtype == np.uint16:
        return array, 16
    if array.dtype == np.bool_:
        return array.astype(np.uint8) * 255, 8
    if np.issubdtype(array.dtype, np.floating):
        peak = float(np.nanmax(array)) if array.size else 0.0
        scale = 65535.0 if peak <= 1.0 else 65535.0 / max(peak, 1e-12)
        return np.clip(np.nan_to_num(array) * scale, 0, 65535).astype(np.uint16), 16
    if np.issubdtype(array.dtype, np.integer):
        if int(array.max(initial=0)) <= 255 and int(array.min(initial=0)) >= 0:
            return array.astype(np.uint8), 8
        return np.clip(array, 0, 65535).astype(np.uint16), 16
    raise ValueError(f"Unsupported pixel type {array.dtype}")


def _as_planes(array: np.ndarray) -> list[np.ndarray]:
    """Arranges an array as a list of ``(C, Y, X)`` planes."""
    array = np.squeeze(array)
    if array.ndim == 2:
        return [array[np.newaxis]]
    if array.ndim == 3:
        if array.shape[-1] in (3, 4) and array.shape[0] not in (3, 4):
            # (Y, X, C): RGB(A) from a photo-style reader; drop alpha.
            return [np.moveaxis(array[..., :3], -1, 0)]
        if array.shape[0] <= MAX_CHANNELS:
            return [array]
        # (Z, Y, X): one single-channel plane per slice.
        return [slice_[np.newaxis] for slice_ in array]
    if array.ndim == 4:
        # (Z, C, Y, X) or (Z, Y, X, C).
        if array.shape[1] <= MAX_CHANNELS:
            return list(array)
        if array.shape[-1] <= 4:
            return [np.moveaxis(volume[..., :3], -1, 0) for volume in array]
    # Deeper stacks: take the first volume and try again.
    return _as_planes(array[0])


def read_image(path: Path) -> DecodedImage:
    suffix = path.suffix.lower()
    if suffix not in SUPPORTED_SUFFIXES:
        raise ValueError(f"Unsupported file type {suffix}")
    raw = tifffile.imread(path) if suffix in (".tif", ".tiff") else iio.imread(path)
    array, bit_depth = _to_integer(np.asarray(raw))
    planes = [np.ascontiguousarray(plane) for plane in _as_planes(array)]
    return DecodedImage(planes=planes, bit_depth=bit_depth)
