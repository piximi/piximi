"""A handful of small images with bright squares on a dark background, for
tests on both sides of the wire. Run as a module to write them to a folder:
``python -m piximi_engine.testing.fixtures <folder>``."""

from __future__ import annotations

import sys
from pathlib import Path

import imageio.v3 as iio
import numpy as np
import tifffile


def write_fixture_images(folder: Path) -> dict[str, np.ndarray]:
    folder.mkdir(parents=True, exist_ok=True)
    rng = np.random.default_rng(0)

    # 8-bit grayscale PNG with two separate squares.
    a = (rng.integers(0, 20, size=(32, 40))).astype(np.uint8)
    a[4:12, 4:12] = 220
    a[18:28, 24:36] = 240
    iio.imwrite(folder / "a.png", a)

    # 16-bit two-channel TIFF (C, Y, X) with one square in each channel.
    b = rng.integers(0, 200, size=(2, 24, 24)).astype(np.uint16)
    b[0, 2:10, 2:10] = 60000
    b[1, 12:22, 12:22] = 50000
    tifffile.imwrite(folder / "b.tif", b)

    # RGB PNG, no objects.
    c = np.zeros((16, 20, 3), dtype=np.uint8)
    c[..., 2] = 30
    iio.imwrite(folder / "c.png", c)

    # Two more flat grayscale PNGs (nothing for a threshold to find), so a
    # classifier has two labeled items per category and one left to predict.
    d = np.full((24, 24), 10, dtype=np.uint8)
    iio.imwrite(folder / "d.png", d)
    e = np.full((20, 28), 110, dtype=np.uint8)
    iio.imwrite(folder / "e.png", e)

    return {"a": a, "b": b, "c": c, "d": d, "e": e}


if __name__ == "__main__":
    written = write_fixture_images(Path(sys.argv[1]))
    print(f"wrote {len(written)} images to {sys.argv[1]}")
