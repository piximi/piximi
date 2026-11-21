"""Writes the ingest vectors shared with the browser's loader:

- ``dims.json``: for every dimension order and a few sizes, the frame index
  of each ``(c, z, t)`` in a flat stack, as ``frame_index`` computes it. The
  browser's ``frameIndex`` must agree, so a dimension config splits a stack
  the same way on both sides.
- ``tiff/pages<N>.tif``: flat stacks of N 4x4 uint16 pages, page k holding
  the constant ``(k + 1) * 100``, so a test can tell from a channel's
  statistics which page landed where; ``tiff/rgb.tif`` is one RGB page
  (three frames, sample k holding ``10 * (k + 1)``); ``tiff/garbage.bin`` is
  not an image.

    uv run python packages/piximi-engine/tests/vectors/gen_ingest.py
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import tifffile

from piximi_engine.decode import frame_index
from piximi_schema.ingest import DimensionOrder

HERE = Path(__file__).parent

SIZES = [(1, 1, 1), (2, 3, 1), (2, 1, 2), (3, 2, 2), (1, 4, 1)]
PAGE_COUNTS = [1, 2, 3, 6, 12]


def page_value(k: int) -> int:
    return (k + 1) * 100


def main() -> None:
    cases = []
    for order in DimensionOrder:
        for channels, slices, frames in SIZES:
            cases.append(
                {
                    "order": order.value,
                    "channels": channels,
                    "slices": slices,
                    "frames": frames,
                    # index[c][z][t]
                    "index": [
                        [
                            [
                                frame_index(order, c, z, t, channels=channels, slices=slices, frames=frames)
                                for t in range(frames)
                            ]
                            for z in range(slices)
                        ]
                        for c in range(channels)
                    ],
                }
            )
    (HERE / "dims.json").write_text(json.dumps({"cases": cases}, indent=1) + "\n")

    tiff = HERE / "tiff"
    tiff.mkdir(exist_ok=True)
    for count in PAGE_COUNTS:
        pages = np.stack([np.full((4, 4), page_value(k), dtype=np.uint16) for k in range(count)])
        tifffile.imwrite(tiff / f"pages{count}.tif", pages, photometric="minisblack")
    rgb = np.stack([np.full((4, 4), 10 * (k + 1), dtype=np.uint8) for k in range(3)], axis=-1)
    tifffile.imwrite(tiff / "rgb.tif", rgb, photometric="rgb")
    (tiff / "garbage.bin").write_bytes(b"not an image at all\x00\x01\x02")
    print(f"wrote dims.json ({len(cases)} cases) and {len(PAGE_COUNTS) + 2} files under tiff/")


if __name__ == "__main__":
    main()
