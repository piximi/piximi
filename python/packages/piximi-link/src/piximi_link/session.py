"""One engine, many peers.

``SessionHub`` registers the protocol's methods on every peer that attaches,
validating params against the schema and relaying results, and broadcasts
the engine's events to all of them, so a change made from one tab or from a
notebook reaches every connected client.
"""

from __future__ import annotations

import logging
import uuid
from collections.abc import Awaitable, Callable
from typing import Any

from pydantic import ValidationError
from piximi_schema import PROTOCOL_VERSION
from piximi_schema.base import WireModel
from piximi_schema.classification import ChangedResult
from piximi_schema.methods import (
    AnnotationCountsParams,
    AnnotationIdsParams,
    AnnotationsCategorizeParams,
    AnnotationsDeleteParams,
    AnnotationsParams,
    CategoriesCreateParams,
    CategoriesDeleteParams,
    CategoriesResult,
    CategoryUpdateParams,
    DeletedResult,
    ImageCountsParams,
    ImageIdsParams,
    ImagesCategorizeParams,
    ImagesDeleteParams,
    ImagesParams,
    JobsCancelParams,
    JobsListResult,
    ListModelsResult,
    LoadModelParams,
    MasksParams,
    RenderImageParams,
    RenderThumbnailsParams,
    SegmentationRunParams,
)
from piximi_schema.query import IdsResult, MasksResult
from piximi_schema.rpc import INVALID_PARAMS
from piximi_schema.segmentation import SegmentationRunRequest
from piximi_schema.session import InitializeParams, InitializeResult, PeerInfo

from .auth import Auth
from .engine import BackendEvent, Engine
from .errors import BackendError, RpcRemoteError
from .peer import HandlerContext, Peer

log = logging.getLogger(__name__)

Handler = Callable[[Any, HandlerContext], Awaitable[Any]]


def _major(version: str) -> str:
    return version.split(".")[0]


class SessionHub:
    def __init__(self, engine: Engine, *, auth: Auth | None = None) -> None:
        self.engine = engine
        self.auth = auth or Auth(None)
        self.session_id = str(uuid.uuid4())
        self._peers: set[Peer] = set()
        self._unsubscribe = engine.subscribe(self._broadcast)

    @property
    def peers(self) -> frozenset[Peer]:
        return frozenset(self._peers)

    def attach(self, peer: Peer) -> None:
        """Serves the protocol on ``peer`` until it closes."""
        self._peers.add(peer)
        self._register(peer)
        peer.on_notification("initialized", lambda _params: None)
        peer.on_notification("$/ping", lambda _params: None)

    def detach(self, peer: Peer) -> None:
        self._peers.discard(peer)

    async def close(self) -> None:
        self._unsubscribe()
        for peer in list(self._peers):
            await peer.close()
        self._peers.clear()

    # ── Events ──────────────────────────────────────────────────────────────

    def _broadcast(self, event: BackendEvent) -> None:
        wire = event.to_wire()
        for peer in list(self._peers):
            if peer.closed:
                self._peers.discard(peer)
                continue
            peer.notify(event.type, wire)

    # ── Methods ─────────────────────────────────────────────────────────────

    def _register(self, peer: Peer) -> None:
        engine = self.engine

        def typed(model: type[WireModel] | None, call: Callable[..., Awaitable[Any]]) -> Handler:
            async def handler(params: Any, ctx: HandlerContext) -> Any:
                if model is None:
                    result = await call(ctx)
                else:
                    try:
                        parsed = model.model_validate(params or {})
                    except ValidationError as error:
                        raise RpcRemoteError(INVALID_PARAMS, str(error)) from error
                    result = await call(parsed, ctx)
                if isinstance(result, WireModel):
                    return result.to_wire()
                if isinstance(result, list):
                    return [item.to_wire() if isinstance(item, WireModel) else item for item in result]
                return result

            return handler

        async def initialize(params: InitializeParams, _ctx: HandlerContext) -> InitializeResult:
            if not self.auth.redeem(params.auth.ticket if params.auth else None):
                raise BackendError("UNAUTHORIZED", "A valid session ticket is required")
            if _major(params.protocol_version) != _major(PROTOCOL_VERSION):
                raise BackendError(
                    "NOT_SUPPORTED",
                    f"Protocol {params.protocol_version} is not supported; "
                    f"this server speaks {PROTOCOL_VERSION}",
                )
            return InitializeResult(
                protocol_version=PROTOCOL_VERSION,
                server_capabilities=engine.capabilities(),
                session_id=self.session_id,
                server_info=PeerInfo(name=engine.name, version=engine.version),
            )

        async def shutdown(_ctx: HandlerContext) -> None:
            return None

        async def images(params: ImagesParams, _ctx: HandlerContext):
            return await engine.images(params.query, params.sort, params.page)

        async def image_ids(params: ImageIdsParams, _ctx: HandlerContext):
            return IdsResult(ids=await engine.image_ids(params.query, params.sort))

        async def image_counts(params: ImageCountsParams, _ctx: HandlerContext):
            return await engine.image_counts(params.query, params.group_by)

        async def annotations(params: AnnotationsParams, _ctx: HandlerContext):
            return await engine.annotations(params.query, params.sort, params.page)

        async def annotation_ids(params: AnnotationIdsParams, _ctx: HandlerContext):
            return IdsResult(ids=await engine.annotation_ids(params.query, params.sort))

        async def annotation_counts(params: AnnotationCountsParams, _ctx: HandlerContext):
            return await engine.annotation_counts(params.query, params.group_by)

        async def masks(params: MasksParams, _ctx: HandlerContext):
            return MasksResult(masks=await engine.masks(params.annotation_ids))

        async def images_delete(params: ImagesDeleteParams, _ctx: HandlerContext):
            return DeletedResult(deleted=await engine.images_delete(params.query))

        async def annotations_delete(params: AnnotationsDeleteParams, _ctx: HandlerContext):
            return DeletedResult(deleted=await engine.annotations_delete(params.query))

        async def images_categorize(params: ImagesCategorizeParams, _ctx: HandlerContext):
            return ChangedResult(changed=await engine.images_categorize(params.query, params.category_id))

        async def annotations_categorize(params: AnnotationsCategorizeParams, _ctx: HandlerContext):
            return ChangedResult(
                changed=await engine.annotations_categorize(params.query, params.category_id)
            )

        async def categories_create(params: CategoriesCreateParams, _ctx: HandlerContext):
            return CategoriesResult(categories=await engine.categories_create(params.categories))

        async def categories_update(params: CategoryUpdateParams, _ctx: HandlerContext):
            return CategoriesResult(
                categories=[await engine.categories_update(params.id, params.name, params.color)]
            )

        async def categories_delete(params: CategoriesDeleteParams, _ctx: HandlerContext):
            return DeletedResult(deleted=await engine.categories_delete(params.ids))

        async def render_image(params: RenderImageParams, _ctx: HandlerContext):
            return await engine.render_image(params.request)

        async def render_thumbnails(params: RenderThumbnailsParams, ctx: HandlerContext):
            return await engine.render_thumbnails(params.requests, ctx)

        async def jobs_list(_ctx: HandlerContext):
            return JobsListResult(jobs=await engine.jobs_list())

        async def jobs_cancel(params: JobsCancelParams, _ctx: HandlerContext):
            await engine.jobs_cancel(params.id)
            return None

        async def list_models(_ctx: HandlerContext):
            return ListModelsResult(models=await engine.segmentation_list_models())

        async def load_model(params: LoadModelParams, ctx: HandlerContext):
            await engine.segmentation_load_model(params.model_id, ctx)
            return None

        async def run(params: SegmentationRunParams, ctx: HandlerContext):
            request = SegmentationRunRequest.model_validate(
                params.model_dump(exclude={"progress_token"})
            )
            return await engine.segmentation_run(request, ctx)

        peer.on_request("initialize", typed(InitializeParams, initialize))
        peer.on_request("shutdown", typed(None, shutdown))
        peer.on_request("query/project", typed(None, lambda _ctx: engine.project()))
        peer.on_request("query/images", typed(ImagesParams, images))
        peer.on_request("query/imageIds", typed(ImageIdsParams, image_ids))
        peer.on_request("query/imageCounts", typed(ImageCountsParams, image_counts))
        peer.on_request("query/annotations", typed(AnnotationsParams, annotations))
        peer.on_request("query/annotationIds", typed(AnnotationIdsParams, annotation_ids))
        peer.on_request("query/annotationCounts", typed(AnnotationCountsParams, annotation_counts))
        peer.on_request("query/masks", typed(MasksParams, masks))
        peer.on_request("images/delete", typed(ImagesDeleteParams, images_delete))
        peer.on_request("annotations/delete", typed(AnnotationsDeleteParams, annotations_delete))
        peer.on_request("images/categorize", typed(ImagesCategorizeParams, images_categorize))
        peer.on_request("annotations/categorize", typed(AnnotationsCategorizeParams, annotations_categorize))
        peer.on_request("categories/create", typed(CategoriesCreateParams, categories_create))
        peer.on_request("categories/update", typed(CategoryUpdateParams, categories_update))
        peer.on_request("categories/delete", typed(CategoriesDeleteParams, categories_delete))
        peer.on_request("render/image", typed(RenderImageParams, render_image))
        peer.on_request("render/thumbnails", typed(RenderThumbnailsParams, render_thumbnails))
        peer.on_request("jobs/list", typed(None, jobs_list))
        peer.on_request("jobs/cancel", typed(JobsCancelParams, jobs_cancel))
        peer.on_request("segmentation/listModels", typed(None, list_models))
        peer.on_request("segmentation/loadModel", typed(LoadModelParams, load_model))
        peer.on_request("segmentation/run", typed(SegmentationRunParams, run))
