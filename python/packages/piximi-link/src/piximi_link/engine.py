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
from piximi_schema.entities import Category
from piximi_schema.events import (
    AnnotationsDidAdd,
    AnnotationsDidRemove,
    AnnotationsDidUpdate,
    CategoriesDidChange,
    ClassifiersDidChange,
    ClassifiersDidEpoch,
    ImagesDidAdd,
    ImagesDidRemove,
    ImagesDidUpdate,
    JobsDidUpdate,
    KindsDidAdd,
    ModelsDidChange,
)
from piximi_schema.jobs import Job
from piximi_schema.methods import RenderThumbnailsResult
from piximi_schema.query import (
    AnnotationCountGroup,
    AnnotationPage,
    AnnotationQuery,
    AnnotationSort,
    CountsResult,
    ImageCountGroup,
    ImagePage,
    ImageQuery,
    ImageSort,
    PageRequest,
    ProjectSummary,
)
from piximi_schema.render import RenderedImage, RenderRequest
from piximi_schema.segmentation import (
    ModelDescriptor,
    SegmentationRunRequest,
    SegmentationRunSummary,
)

from .peer import HandlerContext

BackendEvent = (
    KindsDidAdd
    | AnnotationsDidAdd
    | JobsDidUpdate
    | ImagesDidAdd
    | ModelsDidChange
    | ImagesDidRemove
    | AnnotationsDidRemove
    | ImagesDidUpdate
    | AnnotationsDidUpdate
    | CategoriesDidChange
    | ClassifiersDidChange
    | ClassifiersDidEpoch
)
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

    async def images(self, query: ImageQuery, sort: ImageSort | None, page: PageRequest) -> ImagePage: ...

    async def image_ids(self, query: ImageQuery, sort: ImageSort | None = None) -> list[str]: ...

    async def image_counts(
        self, query: ImageQuery, group_by: ImageCountGroup | None = None
    ) -> CountsResult: ...

    async def annotations(
        self, query: AnnotationQuery, sort: AnnotationSort | None, page: PageRequest
    ) -> AnnotationPage: ...

    async def annotation_ids(
        self, query: AnnotationQuery, sort: AnnotationSort | None = None
    ) -> list[str]: ...

    async def annotation_counts(
        self, query: AnnotationQuery, group_by: AnnotationCountGroup | None = None
    ) -> CountsResult: ...

    async def masks(self, annotation_ids: list[str]) -> dict[str, list[int]]: ...

    # ── Mutations ───────────────────────────────────────────────────────────

    async def images_delete(self, query: ImageQuery) -> int:
        """Removes every image the query matches, with its planes, channels
        and objects; announces ``images/didRemove``; returns how many."""
        ...

    async def annotations_delete(self, query: AnnotationQuery) -> int:
        """Removes every annotation the query matches and any volume left
        empty; announces ``annotations/didRemove``; returns how many."""
        ...

    async def images_categorize(self, query: ImageQuery, category_id: str) -> int:
        """Moves every match to the category, as a hand-made change (the
        shared partition and correction rules apply); announces
        ``images/didUpdate``; returns how many changed."""
        ...

    async def annotations_categorize(self, query: AnnotationQuery, category_id: str) -> int:
        """Moves the volume of every match to the category, which also sets
        its kind; announces ``annotations/didUpdate``; returns how many of
        the matches changed."""
        ...

    async def categories_create(self, categories: list[Category]) -> list[Category]:
        """Adds categories made by the client; announces ``categories/didChange``."""
        ...

    async def categories_update(self, id: str, name: str | None, color: str | None) -> Category: ...

    async def categories_delete(self, ids: list[str]) -> int:
        """Removes categories, returning their items to the unknown one of
        their kind; the reserved unknown categories stay. Returns how many."""
        ...

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

    async def segmentation_list_models(self) -> list[ModelDescriptor]: ...

    async def segmentation_load_model(self, model_id: str, ctx: HandlerContext) -> None: ...

    async def segmentation_run(
        self, request: SegmentationRunRequest, ctx: HandlerContext
    ) -> SegmentationRunSummary:
        """Runs, announces the results as events, and resolves with a summary;
        a cancelled run resolves with ``cancelled=True`` and what it added."""
        ...
