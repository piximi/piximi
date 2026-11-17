"""A thresholding "model": Otsu (or a given level) plus connected components.

Nothing to download, deterministic, and fast, so it is what the tests and
CI run; it also makes a usable baseline on simple fluorescence images.
"""

from __future__ import annotations

from typing import Any

import numpy as np
from scipy import ndimage
from skimage.filters import threshold_otsu

from piximi_link.peer import HandlerContext
from piximi_schema.segmentation import (
    ChannelPolicyPassthrough,
    NumberOptionField,
    OptionGroup,
    OptionSchema,
    OutputPolicySingle,
)

from .base import Detection, SegmentationModel, labels_to_detections

EIGHT_CONNECTED = np.ones((3, 3), dtype=bool)


class ThresholdSegmenter(SegmentationModel):
    id = "threshold"
    display_name = "Threshold (Otsu)"
    description = "Thresholds the image and labels each connected component as an object"
    use = "A quick baseline for bright objects on a dark background"
    output_policy = OutputPolicySingle(mode="single", default_kind_name="Object")
    channel_policy = ChannelPolicyPassthrough(mode="passthrough", max_channels=1)
    option_schema = OptionSchema(
        groups=[
            OptionGroup(
                id="threshold",
                label="Threshold",
                fields=[
                    NumberOptionField(
                        key="threshold",
                        label="Level",
                        type="number",
                        optional=True,
                        empty_label="Otsu",
                        tooltip="Pixel value above which a pixel is foreground; empty picks it with Otsu's method",
                    ),
                    NumberOptionField(
                        key="minArea",
                        label="Minimum area",
                        type="number",
                        default=4,
                        min=1,
                        step=1,
                        tooltip="Components with fewer pixels are dropped",
                    ),
                ],
            )
        ]
    )

    @property
    def loaded(self) -> bool:
        return True

    def segment(
        self, image: np.ndarray, options: dict[str, Any], kind_name: str, ctx: HandlerContext
    ) -> list[Detection]:
        plane = image.mean(axis=0) if image.shape[0] > 1 else image[0]
        level = options.get("threshold")
        if level is None:
            level = threshold_otsu(plane) if plane.min() != plane.max() else plane.max()
        labels, _ = ndimage.label(plane > level, structure=EIGHT_CONNECTED)
        min_area = int(options.get("minArea") or 1)
        return labels_to_detections(labels, kind_name, min_area=min_area)
