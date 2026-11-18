import time

import numpy as np

from piximi_model_sdk import Context, LabelResult, SegmentationModel


class RowThreshold(SegmentationModel):
    """Labels pixels above a level, one row at a time so a cancel can land
    mid-image, and names every object after the numpy it ran on."""

    def load(self, ctx: Context) -> None:
        ctx.progress(f"numpy {np.__version__}", 100)

    def segment(self, image, options, ctx: Context) -> LabelResult:
        plane = image[0]
        foreground = np.zeros(plane.shape, dtype=bool)
        delay = float(options.get("delay") or 0)
        for row in range(plane.shape[0]):
            ctx.check_cancelled()
            foreground[row] = plane[row] > options["threshold"]
            if delay:
                time.sleep(delay)
        labels = _label(foreground)
        count = int(labels.max())
        return LabelResult(labels, classes=[f"numpy{np.__version__.split('.')[0]}"] * count)


def _label(mask: np.ndarray) -> np.ndarray:
    """4-connected components without scipy: a two-pass union-find."""
    labels = np.zeros(mask.shape, dtype=np.int32)
    parent: list[int] = [0]

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for y in range(mask.shape[0]):
        for x in range(mask.shape[1]):
            if not mask[y, x]:
                continue
            up = labels[y - 1, x] if y > 0 else 0
            left = labels[y, x - 1] if x > 0 else 0
            if up and left:
                a, b = find(up), find(left)
                labels[y, x] = a
                if a != b:
                    parent[b] = a
            elif up or left:
                labels[y, x] = up or left
            else:
                parent.append(len(parent))
                labels[y, x] = len(parent) - 1
    roots = {}
    out = np.zeros_like(labels)
    for y, x in zip(*np.nonzero(labels)):
        root = find(labels[y, x])
        out[y, x] = roots.setdefault(root, len(roots) + 1)
    return out


MODEL = RowThreshold()
