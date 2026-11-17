"""Compositing, matching the frontend's ``compositeChannels``: each channel is
levelled by its ramp, scaled by its colour weights and rounded; channels are
summed and saturate at 255."""

from __future__ import annotations

import io

import imageio.v3 as iio
import numpy as np

from piximi_schema.entities import ColorMap


def level(pixels: np.ndarray, bit_depth: int, ramp_min: float, ramp_max: float) -> np.ndarray:
    """``0..1`` after the ramp, as the frontend's LUT computes it."""
    max_intensity = 2**bit_depth - 1
    lo = ramp_min or 0.0
    hi = ramp_max or float(max_intensity)
    span = hi - lo
    if span <= 0:
        return np.zeros(pixels.shape, dtype=np.float32)
    return np.clip((pixels.astype(np.float32) - lo) / span, 0.0, 1.0)


def composite(
    layers: list[tuple[np.ndarray, int, ColorMap, float, float]],
    region: tuple[int, int, int, int] | None = None,
) -> np.ndarray:
    """``layers`` are ``(pixels, bit_depth, color_map, ramp_min, ramp_max)``;
    returns ``(H, W, 3)`` uint8."""
    if not layers:
        raise ValueError("No layers to composite")
    height, width = layers[0][0].shape
    x0, y0, x1, y1 = region or (0, 0, width, height)
    rgb = np.zeros((y1 - y0, x1 - x0, 3), dtype=np.float32)
    for pixels, bit_depth, color_map, ramp_min, ramp_max in layers:
        levelled = level(pixels[y0:y1, x0:x1], bit_depth, ramp_min, ramp_max)
        for channel, weight in enumerate(color_map):
            # `floor(x + 0.5)` is JavaScript's Math.round for non-negatives.
            rgb[..., channel] += np.minimum(255.0, np.floor(levelled * 255.0 * weight + 0.5))
    return np.minimum(255.0, rgb).astype(np.uint8)


def encode_png(rgb: np.ndarray) -> bytes:
    buffer = io.BytesIO()
    iio.imwrite(buffer, rgb, extension=".png")
    return buffer.getvalue()
