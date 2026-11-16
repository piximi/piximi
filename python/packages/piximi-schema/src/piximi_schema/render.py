from typing import Annotated, Literal

from pydantic import Field

from .base import WireModel
from .entities import BBox, ColorMap
from .errors import BackendErrorData


class ChannelDisplay(WireModel):
    """Per-client display settings; they travel with every request and are
    never stored by the backend."""

    channel_id: str
    color_map: ColorMap
    ramp_min: float
    ramp_max: float
    visible: bool


class RenderRequest(WireModel):
    channels: list[ChannelDisplay]
    """All channels of one plane; hidden ones are skipped."""
    region: BBox | None = None
    scale: float | None = None


class RenderedImage(WireModel):
    width: int
    height: int
    mime: Literal["image/png", "image/webp"]
    data: bytes


class ThumbnailRendered(WireModel):
    index: int
    status: Literal["rendered"]
    image: RenderedImage


class ThumbnailFailed(WireModel):
    index: int
    status: Literal["failed"]
    error: BackendErrorData


ThumbnailResult = Annotated[
    ThumbnailRendered | ThumbnailFailed, Field(discriminator="status")
]


class ThumbnailsPartial(WireModel):
    """Progress payload of ``render/thumbnails``: results as they complete."""

    results: list[ThumbnailResult]
