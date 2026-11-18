"""A large synthetic project, written straight into an engine's stores.

For exercising paging and the grids at scale without decoding files:

    python -m piximi_engine.testing.bulk <data-dir> 20000 --objects 30
    piximi serve --data-dir <data-dir>

Images are small noisy squares with a few bright blobs, spread over a few
categories, partitions and confidences so every filter has something to
match; objects are square annotations of one kind. Everything is
deterministic for a seed.
"""

from __future__ import annotations

import argparse
import sys
import time
from collections.abc import Iterable
from pathlib import Path
from typing import TypeVar

import numpy as np
from piximi_schema.entities import (
    AnnotationCategory,
    AnnotationObject,
    AnnotationVolume,
    Channel,
    ImageCategory,
    ImageObject,
    ImageSeries,
    Partition,
    Plane,
    Shape,
)
from piximi_schema.unknown import UNKNOWN_IMAGE_CATEGORY_ID, generate_kind, generate_uuid

from ..engine import ReferenceEngine
from ..store import annotation_index

T = TypeVar("T")

WORDS = ("nucleus", "Plate", "well", "Field", "cell", "tile", "Scan", "site")
COLORS = ("#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4", "#46f0f0")
PARTITIONS = (Partition.UNASSIGNED, Partition.TRAINING, Partition.VALIDATION, Partition.INFERENCE)


def _batches(items: list[T], size: int) -> Iterable[list[T]]:
    for start in range(0, len(items), size):
        yield items[start : start + size]


def _pixels(rng: np.random.Generator, size: int) -> np.ndarray:
    pixels = rng.integers(0, 40, size=(size, size)).astype(np.uint8)
    for _ in range(rng.integers(1, 4)):
        y, x = rng.integers(2, size - 10, size=2)
        pixels[y : y + 8, x : x + 8] = rng.integers(180, 255)
    return pixels


def populate(
    engine: ReferenceEngine,
    count: int,
    *,
    objects: int = 0,
    channels: int = 2,
    size: int = 64,
    seed: int = 0,
    pixels: bool = True,
    batch: int = 1000,
    log: bool = False,
) -> dict[str, int]:
    """Adds ``count`` images (``objects`` annotations each) to the engine and
    returns what it added. With ``pixels=False`` only metadata is written,
    which is enough for query tests but not for rendering."""
    rng = np.random.default_rng(seed)
    started = time.perf_counter()
    experiment = engine.ensure_channels(channels)
    engine.ensure_channel_metas(channels, 8, 255.0)

    categories = [
        ImageCategory(type="image", id=generate_uuid(), color=COLORS[i], name=f"Class {i}", is_unknown=False)
        for i in range(3)
    ]
    engine.meta.put_many("category", [(category, None) for category in categories])
    image_categories = [UNKNOWN_IMAGE_CATEGORY_ID, *(category.id for category in categories)]

    kind = None
    annotation_categories: list[str] = []
    if objects:
        kind, unknown = generate_kind("Cell")
        engine.meta.put_many("kind", [(kind, None)])
        named = [
            AnnotationCategory(
                type="annotation", id=generate_uuid(), color=COLORS[3 + i], name=f"Type {i}", is_unknown=False, kind_id=kind.id
            )
            for i in range(3)
        ]
        engine.meta.put_many("category", [(unknown, None), *((category, None) for category in named)])
        annotation_categories = [unknown.id, *(category.id for category in named)]

    shape = Shape(planes=1, height=size, width=size, channels=channels)
    added_images = added_annotations = 0
    for indices in _batches(list(range(count)), batch):
        series: list[tuple[ImageSeries, None]] = []
        images: list[tuple[ImageObject, str]] = []
        planes: list[tuple[Plane, str]] = []
        channel_rows: list[tuple[Channel, str]] = []
        volumes: list[tuple[AnnotationVolume, str]] = []
        annotations: list[tuple[AnnotationObject, str]] = []
        index: dict[str, dict] = {}
        for i in indices:
            series_id, image_id, plane_id = generate_uuid(), generate_uuid(), generate_uuid()
            name = f"{WORDS[i % len(WORDS)]}_{i:06d}"
            partition = PARTITIONS[rng.integers(0, len(PARTITIONS))]
            category_id = image_categories[rng.integers(0, len(image_categories))]
            confidence = float(rng.random()) if partition == Partition.INFERENCE else None
            series.append(
                (
                    ImageSeries(
                        id=series_id, experiment_id=experiment.id, name=name, bit_depth=8, shape=shape,
                        time_series=False, active_image_id=image_id,
                    ),
                    None,
                )
            )
            images.append(
                (
                    ImageObject(
                        id=image_id, name=name, series_id=series_id, shape=shape, category_id=category_id,
                        active_plane_id=plane_id, timepoint=0, bit_depth=8, partition=partition,
                        prediction_confidence=confidence,
                    ),
                    series_id,
                )
            )
            planes.append((Plane(id=plane_id, image_id=image_id, z_index=0), image_id))
            for c in range(channels):
                channel_id = generate_uuid()
                data = _pixels(rng, size) if pixels else None
                if data is not None:
                    engine.pixels.put(channel_id, data)
                channel_rows.append(
                    (
                        Channel(
                            id=channel_id, plane_id=plane_id, channel_meta_id=f"channel-meta-{c}", name=f"Channel {c}",
                            dtype="uint8", bit_depth=8, width=size, height=size,
                            max_value=float(data.max()) if data is not None else 255.0,
                            min_value=float(data.min()) if data is not None else 0.0,
                        ),
                        plane_id,
                    )
                )
            for _ in range(objects):
                assert kind is not None
                side = int(rng.integers(4, 12))
                y0, x0 = (int(v) for v in rng.integers(0, size - side, size=2))
                volume = AnnotationVolume(
                    id=generate_uuid(), image_id=image_id, kind_id=kind.id,
                    category_id=annotation_categories[rng.integers(0, len(annotation_categories))],
                    prediction_confidence=float(rng.random()) if rng.random() < 0.5 else None,
                )
                annotation = AnnotationObject(
                    id=generate_uuid(), plane_id=plane_id, image_id=image_id, volume_id=volume.id,
                    partition=PARTITIONS[rng.integers(0, len(PARTITIONS))],
                    shape=Shape(planes=1, height=side, width=side, channels=channels),
                    bounding_box=(x0, y0, x0 + side, y0 + side),
                    # A full square: no background run, then every pixel.
                    encoded_mask=[0, side * side],
                )
                volumes.append((volume, image_id))
                annotations.append((annotation, image_id))
                index[annotation.id] = annotation_index(volume)
        engine.meta.put_many("series", series)
        engine.meta.put_many("image", images)
        engine.meta.put_many("plane", planes)
        engine.meta.put_many("channel", channel_rows)
        engine.meta.put_many("volume", volumes)
        engine.meta.put_many("annotation", annotations, index=index)
        added_images += len(images)
        added_annotations += len(annotations)
        if log:
            print(f"  {added_images}/{count} images, {added_annotations} objects, {time.perf_counter() - started:.1f}s", flush=True)
    return {"images": added_images, "annotations": added_annotations}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("data_dir", help="The engine data directory to write (then `piximi serve --data-dir`)")
    parser.add_argument("count", type=int, help="Images to add")
    parser.add_argument("--objects", type=int, default=0, help="Annotations per image")
    parser.add_argument("--channels", type=int, default=2)
    parser.add_argument("--size", type=int, default=64, help="Image side in pixels")
    parser.add_argument("--seed", type=int, default=0)
    parser.add_argument("--no-pixels", action="store_true", help="Metadata only (nothing will render)")
    args = parser.parse_args(argv)
    engine = ReferenceEngine(Path(args.data_dir), models={})
    added = populate(
        engine, args.count, objects=args.objects, channels=args.channels, size=args.size, seed=args.seed,
        pixels=not args.no_pixels, log=True,
    )
    engine.meta.close()
    print(f"added {added['images']} images and {added['annotations']} objects to {args.data_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
