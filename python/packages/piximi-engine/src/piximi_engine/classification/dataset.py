"""Turning a target's items into the arrays a classifier trains on, the
way the frontend's worker preprocesses them (``preprocess.ts``): the item's
channels, cropped to its region, resized or padded-and-cropped to the input
shape, and scaled by the bit depth."""

from __future__ import annotations

from dataclasses import dataclass
import numpy as np
from skimage.transform import resize

from piximi_schema.classification import CropSchema, PreprocessSettings
from piximi_schema.entities import AnnotationHeader, Channel, ImageObject

from ..store import PixelStore
from .prng import mulberry32


@dataclass(frozen=True)
class Sample:
    """What a classifier item is made of."""

    id: str
    plane_id: str
    region: tuple[int, int, int, int] | None
    """``(x0, y0, x1, y1)`` for an object; the whole plane for an image."""
    bit_depth: int


def image_sample(image: ImageObject) -> Sample:
    return Sample(image.id, image.active_plane_id, None, int(image.bit_depth))


def annotation_sample(annotation: AnnotationHeader, bit_depth: int) -> Sample:
    x0, y0, x1, y1 = annotation.bounding_box
    return Sample(annotation.id, annotation.plane_id, (x0, y0, x1, y1), bit_depth)


def _fit_channels(stack: np.ndarray, channels: int) -> np.ndarray:
    """The first ``channels`` planes; a source with fewer repeats its last."""
    if stack.shape[0] >= channels:
        return stack[:channels]
    extra = np.repeat(stack[-1:], channels - stack.shape[0], axis=0)
    return np.concatenate([stack, extra], axis=0)


def _pad_to(stack: np.ndarray, height: int, width: int) -> np.ndarray:
    """Zero padding centred on the content, as ``padToMatch``."""
    _, h, w = stack.shape
    dh, dw = max(0, height - h), max(0, width - w)
    if dh == 0 and dw == 0:
        return stack
    return np.pad(stack, ((0, 0), (dh // 2, dh - dh // 2), (dw // 2, dw - dw // 2)))


def preprocess_one(
    stack: np.ndarray,
    settings: PreprocessSettings,
    bit_depth: int,
    *,
    random_crop: bool = False,
    rng=None,
) -> np.ndarray:
    """One ``(C, h, w)`` crop to ``(channels, height, width)`` float32."""
    shape = settings.input_shape
    stack = _fit_channels(np.asarray(stack), shape.channels).astype(np.float32)
    if settings.crop_options.crop_schema == CropSchema.MATCH:
        stack = _pad_to(stack, shape.height, shape.width)
        _, h, w = stack.shape
        if random_crop and rng is not None:
            y0 = int(rng() * (h - shape.height + 1)) if h > shape.height else 0
            x0 = int(rng() * (w - shape.width + 1)) if w > shape.width else 0
        else:
            y0, x0 = (h - shape.height) // 2, (w - shape.width) // 2
        stack = stack[:, y0 : y0 + shape.height, x0 : x0 + shape.width]
    else:
        stack = resize(
            stack,
            (stack.shape[0], shape.height, shape.width),
            order=1,
            preserve_range=True,
            anti_aliasing=False,
        ).astype(np.float32)
    if settings.normalize_options.normalize:
        stack = stack / float(2**bit_depth - 1)
    return np.ascontiguousarray(stack)


def materialize(
    pixels: PixelStore,
    samples: list[Sample],
    channels_by_plane: dict[str, list[Channel]],
    settings: PreprocessSettings,
    *,
    training: bool = False,
    seed: int = 0,
) -> np.ndarray:
    """``(N, channels, height, width)`` float32 for the samples, in order.
    Training with several crops repeats each sample that many times with
    a different random crop, as the worker does. Reads pixels only, so it
    can run off the loop thread (the metadata store cannot)."""
    crops = settings.crop_options.num_crops if training and settings.crop_options.num_crops > 1 else 1
    rng = mulberry32(seed) if crops > 1 else None
    shape = settings.input_shape
    out = np.empty((len(samples) * crops, shape.channels, shape.height, shape.width), dtype=np.float32)
    for index, sample in enumerate(samples):
        channels = channels_by_plane[sample.plane_id]
        stack = np.stack([pixels.get(channel.id, sample.region) for channel in channels])
        for crop in range(crops):
            out[index * crops + crop] = preprocess_one(
                stack, settings, sample.bit_depth, random_crop=crops > 1, rng=rng
            )
    return out


def repeat_labels(labels: np.ndarray, settings: PreprocessSettings, *, training: bool) -> np.ndarray:
    crops = settings.crop_options.num_crops if training and settings.crop_options.num_crops > 1 else 1
    return np.repeat(labels, crops) if crops > 1 else labels
