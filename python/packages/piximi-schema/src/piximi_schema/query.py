"""Reading a project: paged, filtered and sorted listings, counts and ids.

Pages address a window by offset into the filtered, sorted result and carry
its ``total``, which is what a virtualized grid needs (it jumps to any
position). The result can shift under concurrent changes; the backend's
events tell a client when to fetch its window again.
"""

from enum import StrEnum

from pydantic import Field

from .base import WireModel
from .entities import (
    AnnotationHeader,
    AnnotationVolume,
    Category,
    Channel,
    ChannelMeta,
    Experiment,
    ImageObject,
    ImageSeries,
    Kind,
    Partition,
    Plane,
)

MAX_PAGE_SIZE = 1000


class PageRequest(WireModel):
    offset: int = Field(default=0, ge=0)
    limit: int = Field(ge=1, le=MAX_PAGE_SIZE)


class SortDirection(StrEnum):
    ASC = "asc"
    DESC = "desc"


class ConfidenceRange(WireModel):
    """Keeps items whose prediction confidence lies strictly between ``min``
    and ``max``; items without one are left out."""

    min: float
    max: float


# ── Images ───────────────────────────────────────────────────────────────────


class ImageSortKey(StrEnum):
    NONE = "none"
    """Insertion order."""
    NAME = "name"
    CATEGORY = "category"
    """By category name."""
    RANDOM = "random"
    """Shuffled by ``seed``; the same seed gives the same order everywhere."""
    SOFTMAX = "softmax"
    """Least confident classifier prediction first (margin between the top
    two classes). Needs the ``classification`` capability."""


class ImageSort(WireModel):
    key: ImageSortKey = ImageSortKey.NONE
    direction: SortDirection = SortDirection.ASC
    seed: int | None = None


class ImageQuery(WireModel):
    """Every condition given must hold; an absent one does not restrict.
    Ties in any sort fall back to insertion order."""

    ids: list[str] | None = None
    series_ids: list[str] | None = None
    category_ids: list[str] | None = None
    partitions: list[Partition] | None = None
    confidence: ConfidenceRange | None = None
    annotated: bool | None = None
    """Only images with (``true``) or without (``false``) any annotation."""


class ImageRecord(WireModel):
    image: ImageObject
    series: ImageSeries
    """The series the image belongs to; several records may share one."""
    planes: list[Plane]
    channels: list[Channel]


class ImagePage(WireModel):
    items: list[ImageRecord]
    total: int
    """Matches of the query, not of the page."""


class ImageCountGroup(StrEnum):
    CATEGORY = "category"
    PARTITION = "partition"


# ── Annotations ──────────────────────────────────────────────────────────────


class AnnotationSortKey(StrEnum):
    NONE = "none"
    PLANE = "plane"
    """By the plane's z-index."""
    VOLUME = "volume"
    """By volume id, keeping an object's planes together."""
    CATEGORY = "category"
    IMAGE = "image"
    """By image name."""
    RANDOM = "random"
    SOFTMAX = "softmax"


class AnnotationSort(WireModel):
    key: AnnotationSortKey = AnnotationSortKey.NONE
    direction: SortDirection = SortDirection.ASC
    seed: int | None = None


class AnnotationQuery(WireModel):
    ids: list[str] | None = None
    image_ids: list[str] | None = None
    plane_ids: list[str] | None = None
    volume_ids: list[str] | None = None
    kind_ids: list[str] | None = None
    category_ids: list[str] | None = None
    partitions: list[Partition] | None = None
    confidence: ConfidenceRange | None = None


class AnnotationRecord(WireModel):
    volume: AnnotationVolume
    annotation: AnnotationHeader


class AnnotationPage(WireModel):
    items: list[AnnotationRecord]
    total: int


class AnnotationCountGroup(StrEnum):
    CATEGORY = "category"
    PARTITION = "partition"
    KIND = "kind"


# ── Shared results ───────────────────────────────────────────────────────────


class IdsResult(WireModel):
    ids: list[str]
    """Every match, in the requested order."""


class CountsResult(WireModel):
    total: int
    groups: dict[str, int] | None = None
    """Matches per group value (a category id, partition or kind id), when
    grouping was asked for; groups with no match are absent."""


class ProjectCounts(WireModel):
    images: int
    annotations: int


class ProjectSummary(WireModel):
    experiment: Experiment
    kinds: list[Kind]
    categories: list[Category]
    channel_metas: list[ChannelMeta]
    counts: ProjectCounts


class MasksResult(WireModel):
    masks: dict[str, list[int]]
    """Encoded masks by annotation id."""
