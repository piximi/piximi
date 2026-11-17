"""What a backend engine must provide to be served to the frontend.

``piximi-link`` depends only on the schema, never on an engine, so any
implementation of this protocol (the reference engine, a wrapper around an
existing application) can be served by ``SessionHub``. Methods mirror the
frontend's ``Backend`` interface domain for domain and speak the schema's
models; long operations get a ``HandlerContext`` for progress and
cooperative cancellation.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Protocol

from piximi_schema.capabilities import Capability
from piximi_schema.events import AnnotationsDidAdd, JobsDidUpdate, KindsDidAdd
from piximi_schema.jobs import Job
from piximi_schema.methods import RenderThumbnailsResult
from piximi_schema.query import (
    AnnotationPage,
    AnnotationQuery,
    ImagePage,
    ImageQuery,
    PageRequest,
    ProjectSummary,
)
from piximi_schema.render import RenderedImage, RenderRequest
from piximi_schema.segmentation import (
    SegmentationModelDescriptor,
    SegmentationRunRequest,
    SegmentationRunSummary,
)

from .peer import HandlerContext

BackendEvent = KindsDidAdd | AnnotationsDidAdd | JobsDidUpdate
EventListener = Callable[[BackendEvent], None]


class Engine(Protocol):
    name: str
    version: str

    def capabilities(self) -> list[Capability]: ...

    def subscribe(self, listener: EventListener) -> Callable[[], None]:
        """Registers a listener for changes the engine originates, from any
        client or from its own API; returns the unsubscribe function."""
        ...

    async def close(self) -> None: ...

    # ── Query ───────────────────────────────────────────────────────────────

    async def project(self) -> ProjectSummary: ...

    async def images(self, query: ImageQuery, page: PageRequest) -> ImagePage: ...

    async def annotations(self, query: AnnotationQuery, page: PageRequest) -> AnnotationPage: ...

    async def masks(self, annotation_ids: list[str]) -> dict[str, list[int]]: ...

    # ── Render ──────────────────────────────────────────────────────────────

    async def render_image(self, request: RenderRequest) -> RenderedImage: ...

    async def render_thumbnails(
        self, requests: list[RenderRequest], ctx: HandlerContext
    ) -> RenderThumbnailsResult:
        """Reports results as ``ThumbnailsPartial`` progress values as they
        complete; stops early when cancelled."""
        ...

    # ── Jobs ────────────────────────────────────────────────────────────────

    async def jobs_list(self) -> list[Job]: ...

    async def jobs_cancel(self, job_id: str) -> None: ...

    # ── Segmentation ────────────────────────────────────────────────────────

    async def segmentation_list_models(self) -> list[SegmentationModelDescriptor]: ...

    async def segmentation_load_model(self, model_id: str, ctx: HandlerContext) -> None: ...

    async def segmentation_run(
        self, request: SegmentationRunRequest, ctx: HandlerContext
    ) -> SegmentationRunSummary:
        """Runs, announces the results as events, and resolves with a summary;
        a cancelled run resolves with ``cancelled=True`` and what it added."""
        ...
