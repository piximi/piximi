"""Channel pixels in a zarr store on disk: one 2D array per channel, keyed by
channel id. The chunking keeps region reads for thumbnails and crops cheap."""

from __future__ import annotations

from pathlib import Path

import numpy as np
import zarr


class PixelStore:
    def __init__(self, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        self._root = zarr.open_group(str(path), mode="a")

    def put(self, channel_id: str, pixels: np.ndarray) -> None:
        if pixels.ndim != 2:
            raise ValueError("A channel is a 2D array")
        height, width = pixels.shape
        array = self._root.create_array(
            channel_id,
            shape=pixels.shape,
            dtype=pixels.dtype,
            chunks=(min(height, 1024), min(width, 1024)),
            overwrite=True,
        )
        array[:] = pixels

    def get(self, channel_id: str, region: tuple[int, int, int, int] | None = None) -> np.ndarray:
        array = self._root[channel_id]
        if region is None:
            return np.asarray(array[:])
        x0, y0, x1, y1 = region
        return np.asarray(array[y0:y1, x0:x1])

    def __contains__(self, channel_id: str) -> bool:
        return channel_id in self._root

    def delete(self, channel_id: str) -> None:
        if channel_id in self._root:
            del self._root[channel_id]
