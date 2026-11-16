from .base import WireModel
from .entities import (
    AnnotationHeader,
    AnnotationVolume,
    Category,
    Channel,
    ChannelMeta,
    Experiment,
    ImageObject,
    Kind,
    Plane,
)


class PageRequest(WireModel):
    cursor: str | None = None
    limit: int


class ImageQuery(WireModel):
    ids: list[str] | None = None


class ImageRecord(WireModel):
    image: ImageObject
    planes: list[Plane]
    channels: list[Channel]


class ImagePage(WireModel):
    items: list[ImageRecord]
    total: int
    next_cursor: str | None = None


class AnnotationQuery(WireModel):
    image_ids: list[str] | None = None


class AnnotationRecord(WireModel):
    volume: AnnotationVolume
    annotation: AnnotationHeader


class AnnotationPage(WireModel):
    items: list[AnnotationRecord]
    total: int
    next_cursor: str | None = None


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
