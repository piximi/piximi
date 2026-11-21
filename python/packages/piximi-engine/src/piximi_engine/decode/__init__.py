"""Reads image files into one or more planes of ``(C, Y, X)`` integer arrays.

Two ways in. Without a dimension config the axes are guessed from the
array's shape (2D images with a handful of channels, z stacks, RGB photos).
With one, the file is a flat stack of 2D frames, as a multi-page TIFF is,
and the config says how the frames map to channels, z slices and time
frames: the browser's loader works it out from the file's metadata (OME,
ImageJ) or asks, and sends it along, so both sides split a stack the same
way (``tests/vectors/dims.json`` pins the frame order).
"""

from __future__ import annotations

import mimetypes
from dataclasses import dataclass
from io import BytesIO
from pathlib import Path

import imageio.v3 as iio
import numpy as np
import tifffile
from piximi_schema.ingest import DimensionConfig, DimensionOrder

SUPPORTED_SUFFIXES = {".tif", ".tiff", ".png", ".jpg", ".jpeg", ".bmp"}
TIFF_SUFFIXES = {".tif", ".tiff"}

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
        if array.shape[-1] in (2, 3, 4) and array.shape[0] not in (3, 4):
            # (Y, X, C): gray+alpha or RGB(A) from a photo-style reader; drop alpha.
            keep = 1 if array.shape[-1] == 2 else 3
            return [np.moveaxis(array[..., :keep], -1, 0)]
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


def _guess(raw: np.ndarray) -> DecodedImage:
    array, bit_depth = _to_integer(np.asarray(raw))
    planes = [np.ascontiguousarray(plane) for plane in _as_planes(array)]
    return DecodedImage(planes=planes, bit_depth=bit_depth)


def read_image(path: Path) -> DecodedImage:
    """One image with guessed axes; see ``decode_path`` for stacks."""
    suffix = path.suffix.lower()
    if suffix not in SUPPORTED_SUFFIXES:
        raise ValueError(f"Unsupported file type {suffix}")
    raw = tifffile.imread(path) if suffix in TIFF_SUFFIXES else iio.imread(path)
    return _guess(raw)


# ── Flat stacks with a dimension config ─────────────────────────────────────


def frame_index(
    order: DimensionOrder | str, c: int, z: int, t: int, *, channels: int, slices: int, frames: int
) -> int:
    """Where frame ``(c, z, t)`` sits in a flat stack whose dimensions after
    x and y vary in ``order``, the first listed fastest (the OME convention:
    ``xyczt`` stores every channel of a plane together, planes of a
    timepoint together). Shared with the browser's loader."""
    sizes = {"c": channels, "z": slices, "t": frames}
    coords = {"c": c, "z": z, "t": t}
    index, stride = 0, 1
    for axis in str(order)[2:]:
        index += coords[axis] * stride
        stride *= sizes[axis]
    return index


def frames_to_images(frames: list[np.ndarray], config: DimensionConfig) -> list[DecodedImage]:
    """Splits a flat stack of 2D frames per the config: one image per time
    frame, each with a ``(C, Y, X)`` plane per z slice."""
    expected = config.channels * config.slices * config.frames
    if len(frames) != expected:
        raise ValueError(
            f"{config.channels} channels x {config.slices} slices x {config.frames} frames "
            f"needs {expected} frames; the file has {len(frames)}"
        )
    shapes = {frame.shape for frame in frames}
    if len(shapes) != 1:
        raise ValueError(f"Frames differ in size: {sorted(shapes)}")
    stack, bit_depth = _to_integer(np.stack(frames))
    sizes = dict(channels=config.channels, slices=config.slices, frames=config.frames)
    images: list[DecodedImage] = []
    for t in range(config.frames):
        planes = []
        for z in range(config.slices):
            plane = np.stack(
                [stack[frame_index(config.dimension_order, c, z, t, **sizes)] for c in range(config.channels)]
            )
            planes.append(np.ascontiguousarray(plane))
        images.append(DecodedImage(planes=planes, bit_depth=bit_depth))
    return images


def tiff_frames(source: Path | BytesIO) -> list[np.ndarray]:
    """Every page of a TIFF as 2D frames, page-major: a page holding several
    samples (an RGB page) contributes one frame per sample, in sample order,
    without its alpha samples. This is how the browser's decoder counts
    frames, so a dimension config means the same thing to both."""
    frames: list[np.ndarray] = []
    with tifffile.TiffFile(source) as tif:
        for page in tif.pages:
            array = np.asarray(page.asarray())
            samples = page.samplesperpixel
            if samples == 1:
                frames.append(array.reshape(array.shape[-2:]))
                continue
            keep = samples - len(page.extrasamples)
            if array.ndim == 3 and array.shape[-1] == samples:
                frames.extend(array[..., i] for i in range(keep))
            elif array.ndim == 3 and array.shape[0] == samples:
                frames.extend(array[i] for i in range(keep))
            else:
                raise ValueError(f"Unexpected page shape {array.shape} for {samples} samples")
    return frames


def _is_tiff(name: str, mime_type: str | None) -> bool:
    if mime_type in ("image/tiff", "image/tif"):
        return True
    return Path(name).suffix.lower() in TIFF_SUFFIXES


def decode_path(path: Path, config: DimensionConfig | None = None) -> list[DecodedImage]:
    """The images in a file: several for a time series, else one."""
    if config is not None and path.suffix.lower() in TIFF_SUFFIXES:
        return frames_to_images(tiff_frames(path), config)
    return [read_image(path)]


def decode_bytes(
    name: str, data: bytes, mime_type: str | None = None, config: DimensionConfig | None = None
) -> list[DecodedImage]:
    """As ``decode_path``, for an uploaded file held in memory."""
    if _is_tiff(name, mime_type):
        if config is not None:
            return frames_to_images(tiff_frames(BytesIO(data)), config)
        return [_guess(tifffile.imread(BytesIO(data)))]
    suffix = Path(name).suffix.lower()
    if suffix not in SUPPORTED_SUFFIXES:
        guessed = mimetypes.guess_extension(mime_type or "") if mime_type else None
        if guessed is None or guessed.lower() not in SUPPORTED_SUFFIXES:
            raise ValueError(f"Unsupported file type {suffix or mime_type or '(unknown)'}")
        suffix = guessed.lower()
    try:
        raw = iio.imread(BytesIO(data), extension=suffix)
    except Exception as error:
        raise ValueError(f"Could not decode {name}: {error}") from error
    return [_guess(raw)]
