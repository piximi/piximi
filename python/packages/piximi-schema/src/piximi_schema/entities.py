"""Project metadata, mirroring ``src/core/entities`` in the frontend.

The frontend checks at compile time that these are structurally compatible
with its domain types (``src/core/backend/protocol/compat.ts``), so a field
added or renamed here must be matched there.
"""

from enum import IntEnum, StrEnum
from typing import Annotated, Literal

from pydantic import Field

from .base import WireModel

# Shared vocabularies are enums rather than Literal aliases so they become
# named, reusable types in the generated TypeScript.


class BitDepth(IntEnum):
    ONE = 1
    EIGHT = 8
    SIXTEEN = 16


class DType(StrEnum):
    UINT8 = "uint8"
    INT32 = "int32"
    FLOAT32 = "float32"


class Partition(StrEnum):
    TRAINING = "Training"
    VALIDATION = "Validation"
    INFERENCE = "Inference"
    UNASSIGNED = "Unassigned"


BBox = tuple[int, int, int, int]
"""``[x1, y1, x2, y2]``."""

ColorMap = tuple[float, float, float]
"""RGB weights in ``0..1``."""


class ObjectFeature(StrEnum):
    AREA = "area"
    SPHERICITY = "sphericity"
    RADIUS = "radius"
    PERIMETER = "perimeter"
    EXTENT = "extent"
    BBOX_AREA = "bboxArea"
    EQPC = "eqpc"
    PED = "ped"
    COMPACTNESS = "compactness"
    COM_X = "comX"
    COM_Y = "comY"


class IntensityMeasurement(StrEnum):
    MAX_VALUE = "maxValue"
    MIN_VALUE = "minValue"
    TOTAL = "total"
    MEAN = "mean"
    MEDIAN = "median"
    STD = "std"
    MAD = "mad"
    LOWER_QUARTILE = "lowerQuartile"
    UPPER_QUARTILE = "upperQuartile"


class ChannelFeature(StrEnum):
    ENTROPY = "entropy"
    CONTRAST = "contrast"
    SNR = "snr"


class Shape(WireModel):
    planes: int
    height: int
    width: int
    channels: int


class PredictionCorrection(WireModel):
    corrected_from_run_id: str
    predicted_category_id: str
    prediction_confidence: float
    corrected_at: str
    """ISO timestamp."""


class Experiment(WireModel):
    id: str
    name: str
    channels: int | None = None


class ImageSeries(WireModel):
    id: str
    experiment_id: str
    name: str
    bit_depth: BitDepth
    shape: Shape
    time_series: bool
    active_image_id: str


class ImageObject(WireModel):
    id: str
    name: str
    series_id: str
    shape: Shape
    category_id: str
    active_plane_id: str
    timepoint: int
    bit_depth: BitDepth
    partition: Partition
    prediction_confidence: float | None = None
    predicted_at_run_id: str | None = None
    prediction_corrected: PredictionCorrection | None = None


class Plane(WireModel):
    id: str
    image_id: str
    z_index: int


class Channel(WireModel):
    """A channel's metadata. Where its pixels live is the backend's business,
    so the frontend's ``storageReference`` has no wire counterpart."""

    id: str
    plane_id: str
    channel_meta_id: str
    name: str
    dtype: DType
    bit_depth: BitDepth
    width: int
    height: int
    max_value: float
    min_value: float
    total: float | None = None
    mean: float | None = None
    median: float | None = None
    std: float | None = None
    mad: float | None = None
    lower_quartile: float | None = None
    upper_quartile: float | None = None
    features: dict[ChannelFeature, float] | None = None


class ChannelMeta(WireModel):
    id: str
    name: str
    bit_depth: BitDepth
    color_map: ColorMap
    visible: bool
    min_value: float
    max_value: float
    ramp_min: float
    ramp_max: float
    ramp_min_limit: float
    ramp_max_limit: float


class Kind(WireModel):
    id: str
    name: str
    unknown_category_id: str


class ImageCategory(WireModel):
    type: Literal["image"]
    id: str
    color: str
    name: str
    is_unknown: bool


class AnnotationCategory(WireModel):
    type: Literal["annotation"]
    id: str
    color: str
    name: str
    is_unknown: bool
    kind_id: str


Category = Annotated[ImageCategory | AnnotationCategory, Field(discriminator="type")]


class AnnotationVolume(WireModel):
    id: str
    image_id: str
    kind_id: str
    category_id: str
    timepoint: int | None = None
    prediction_confidence: float | None = None
    predicted_at_run_id: str | None = None
    prediction_corrected: PredictionCorrection | None = None


class AnnotationHeader(WireModel):
    """An annotation without its mask; masks are fetched separately."""

    id: str
    plane_id: str
    image_id: str
    volume_id: str
    partition: Partition
    shape: Shape
    bounding_box: BBox
    features: dict[ObjectFeature, float] | None = None
    intensity_measurements: dict[str, dict[IntensityMeasurement, float]] | None = None


class AnnotationObject(AnnotationHeader):
    encoded_mask: list[int]
    """Binary run-length encoding, cropped to the bounding box: alternating
    background and foreground run lengths, starting with background."""
