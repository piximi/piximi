"""Every method and notification in the protocol, with its payload types.

This is what the bundle's ``methods`` and ``notifications`` sections are built
from, and what the frontend's ``ProtocolMethods`` map is generated from.
"""

from dataclasses import dataclass
from typing import Literal

from .base import WireModel
from .events import EVENT_TYPES
from .jobs import Job
from .query import (
    AnnotationPage,
    AnnotationQuery,
    ImagePage,
    ImageQuery,
    MasksResult,
    PageRequest,
    ProjectSummary,
)
from .render import RenderedImage, RenderRequest, ThumbnailsPartial
from .rpc import CancelParams, ProgressParams, ProgressValue
from .segmentation import (
    SegmentationModelDescriptor,
    SegmentationRunRequest,
    SegmentationRunSummary,
)
from .session import InitializeParams, InitializeResult

Direction = Literal["client->server", "server->client"]


# ── Params / results that exist only to name a method's payload ─────────────


class ImagesParams(WireModel):
    query: ImageQuery
    page: PageRequest


class AnnotationsParams(WireModel):
    query: AnnotationQuery
    page: PageRequest


class MasksParams(WireModel):
    annotation_ids: list[str]


class RenderImageParams(WireModel):
    request: RenderRequest


class RenderThumbnailsParams(WireModel):
    requests: list[RenderRequest]
    progress_token: str | None = None
    """Results stream back as ``$/progress`` with ``ThumbnailsPartial`` values."""


class RenderThumbnailsResult(WireModel):
    rendered: int
    failed: int


class JobsListResult(WireModel):
    jobs: list[Job]


class JobsCancelParams(WireModel):
    id: str


class ListModelsResult(WireModel):
    models: list[SegmentationModelDescriptor]


class LoadModelParams(WireModel):
    model_id: str
    progress_token: str | None = None


class SegmentationRunParams(SegmentationRunRequest):
    progress_token: str | None = None


# ── Registry ────────────────────────────────────────────────────────────────


@dataclass(frozen=True)
class MethodSpec:
    name: str
    params: type[WireModel] | None
    result: type[WireModel] | None
    direction: Direction = "client->server"
    progress: type[WireModel] | None = None
    """Payload of ``$/progress`` notifications sent while it runs."""


@dataclass(frozen=True)
class NotificationSpec:
    name: str
    params: type[WireModel] | None
    direction: Direction


METHODS: tuple[MethodSpec, ...] = (
    MethodSpec("initialize", InitializeParams, InitializeResult),
    MethodSpec("shutdown", None, None),
    MethodSpec("query/project", None, ProjectSummary),
    MethodSpec("query/images", ImagesParams, ImagePage),
    MethodSpec("query/annotations", AnnotationsParams, AnnotationPage),
    MethodSpec("query/masks", MasksParams, MasksResult),
    MethodSpec("render/image", RenderImageParams, RenderedImage),
    MethodSpec(
        "render/thumbnails",
        RenderThumbnailsParams,
        RenderThumbnailsResult,
        progress=ThumbnailsPartial,
    ),
    MethodSpec("jobs/list", None, JobsListResult),
    MethodSpec("jobs/cancel", JobsCancelParams, None),
    MethodSpec("segmentation/listModels", None, ListModelsResult),
    MethodSpec("segmentation/loadModel", LoadModelParams, None, progress=ProgressValue),
    MethodSpec(
        "segmentation/run",
        SegmentationRunParams,
        SegmentationRunSummary,
        progress=ProgressValue,
    ),
)

NOTIFICATIONS: tuple[NotificationSpec, ...] = (
    NotificationSpec("initialized", None, "client->server"),
    NotificationSpec("$/cancelRequest", CancelParams, "client->server"),
    NotificationSpec("$/progress", ProgressParams, "server->client"),
    NotificationSpec("$/ping", None, "client->server"),
    # Events: one notification per event type, carrying the event itself.
    *(
        NotificationSpec(event.model_fields["type"].annotation.__args__[0], event, "server->client")
        for event in EVENT_TYPES
    ),
)
