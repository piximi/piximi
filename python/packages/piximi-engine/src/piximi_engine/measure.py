"""Object measurements for a mask and the pixels under it.

Shape features follow the frontend's `computeObjectFeatures` definitions in
terms of area, perimeter and the derived diameters. The frontend takes
perimeter from image-js's ROI tracing; this uses scikit-image's, so the
perimeter-derived values agree closely rather than bit for bit. Intensity
statistics are the same formulas as `computeObjectIntensityMeasurements`.
"""

from __future__ import annotations

import math

import numpy as np
from skimage.measure import perimeter as skimage_perimeter

# Below this many pixels the quartile statistics are meaningless; the
# frontend skips intensities for such objects too.
MIN_QUARTILE_SAMPLE_SIZE = 4


def object_features(mask: np.ndarray) -> dict[str, float]:
    mask = np.asarray(mask, dtype=bool)
    height, width = mask.shape
    area = float(mask.sum())
    if area == 0:
        return {}
    perimeter = float(skimage_perimeter(mask, neighborhood=8))
    eqpc = 2.0 * math.sqrt(area / math.pi)
    ped = perimeter / math.pi
    sphericity = eqpc / ped if ped > 0 else 0.0
    rows, cols = np.nonzero(mask)
    return {
        "area": area,
        "perimeter": perimeter,
        "radius": ped / 2.0,
        "sphericity": sphericity,
        "extent": area / float(width * height),
        "bboxArea": float(width * height),
        "eqpc": eqpc,
        "ped": ped,
        "compactness": 1000.0 if sphericity == 0 else 1.0 / sphericity,
        "comX": float(cols.mean()),
        "comY": float(rows.mean()),
    }


def intensity_measurements(mask: np.ndarray, pixels: np.ndarray) -> dict[str, float] | None:
    """Statistics of ``pixels`` under ``mask`` (same shape); ``None`` when the
    object is too small for them to mean anything."""
    values = np.asarray(pixels)[np.asarray(mask, dtype=bool)].astype(np.float64)
    if values.size < MIN_QUARTILE_SAMPLE_SIZE:
        return None
    median = float(np.median(values))
    return {
        "maxValue": float(values.max()),
        "minValue": float(values.min()),
        "total": float(values.sum()),
        "mean": float(values.mean()),
        "median": median,
        "std": float(values.std()),
        "mad": float(np.median(np.abs(values - median))),
        "lowerQuartile": float(np.percentile(values, 25)),
        "upperQuartile": float(np.percentile(values, 75)),
    }
