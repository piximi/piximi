"""One engine, many peers.

``SessionHub`` registers the protocol's methods on every peer that attaches,
validating params against the schema and relaying results, and broadcasts
the engine's events to all of them, so a change made from one tab or from a
notebook reaches every connected client.
"""

from __future__ import annotations

import asyncio
import logging
import uuid
from collections.abc import Awaitable, Callable
from typing import Any

from pydantic import ValidationError
from piximi_schema import PROTOCOL_VERSION
from piximi_schema.base import WireModel
from piximi_schema.classification import (
    ChangedResult,
    ClassificationTargetRequest,
    ClassifierCreateRequest,
    ClassifierFitRequest,
    ClassifierImportRequest,
    ClassifierPredictRequest,
    ClassifierRequest,
    ClassifiersResult,
    ClassifierUpdateRequest,
)
from piximi_schema.editing import (
    AnnotationChangeSet,
    AnnotationsCommitParams,
    AnnotationsUpdateParams,
    ExperimentResult,
    ImagesResult,
    ImagesUpdateParams,
    KindsCreateParams,
    KindsDeleteParams,
    KindsResult,
    KindUpdateParams,
    ProjectUpdateParams,
)
from piximi_schema.ingest import IngestCloseParams, IngestOpenParams, IngestPutParams
from piximi_schema.measurements import MeasurementsComputeRequest, MeasurementTableRequest
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
    ClassifierFitParams,
    ClassifierPredictParams,
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
    MeasurementsComputeParams,
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
        self._uploads: dict[Peer, set[str]] = {}
        """Uploads each peer has open, closed as cancelled if it goes away."""
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
        for upload_id in self._uploads.pop(peer, ()):
            self._abandon(upload_id)

    def _abandon(self, upload_id: str) -> None:
        """A peer left mid-upload: end its job as cancelled, on the loop if
        one is running (``detach`` is called from a transport's teardown)."""

        async def close() -> None:
            try:
                await self.engine.ingest_close(upload_id, cancelled=True)
            except Exception:
                log.exception("closing abandoned upload %s", upload_id)

        try:
            asyncio.get_running_loop().create_task(close())
        except RuntimeError:
            log.warning("upload %s abandoned with no loop to close it on", upload_id)

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

        async def annotations_commit(params: AnnotationsCommitParams, ctx: HandlerContext):
            changeset = AnnotationChangeSet.model_validate(params.model_dump(exclude={"progress_token"}))
            return await engine.annotations_commit(changeset, ctx)

        async def annotations_update(params: AnnotationsUpdateParams, _ctx: HandlerContext):
            return ChangedResult(changed=await engine.annotations_update(params.updates))

        async def images_update(params: ImagesUpdateParams, _ctx: HandlerContext):
            return ImagesResult(images=await engine.images_update(params.updates))

        async def kinds_create(params: KindsCreateParams, _ctx: HandlerContext):
            return KindsResult(kinds=await engine.kinds_create(params.kinds))

        async def kinds_update(params: KindUpdateParams, _ctx: HandlerContext):
            return KindsResult(kinds=[await engine.kinds_update(params.id, params.name)])

        async def kinds_delete(params: KindsDeleteParams, _ctx: HandlerContext):
            return DeletedResult(deleted=await engine.kinds_delete(params.ids))

        async def project_update(params: ProjectUpdateParams, _ctx: HandlerContext):
            return ExperimentResult(experiment=await engine.project_update(params.name))

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

        async def measurements_compute(params: MeasurementsComputeParams, ctx: HandlerContext):
            request = MeasurementsComputeRequest.model_validate(params.model_dump(exclude={"progress_token"}))
            return await engine.measurements_compute(request, ctx)

        async def run(params: SegmentationRunParams, ctx: HandlerContext):
            request = SegmentationRunRequest.model_validate(
                params.model_dump(exclude={"progress_token"})
            )
            return await engine.segmentation_run(request, ctx)

        async def list_architectures(_ctx: HandlerContext):
            return ListModelsResult(models=await engine.classification_list_architectures())

        async def list_classifiers(_ctx: HandlerContext):
            return ClassifiersResult(classifiers=await engine.classification_list())

        async def classifier_delete(params: ClassifierRequest, _ctx: HandlerContext):
            await engine.classification_delete(params.classifier_id)
            return None

        async def classifier_fit(params: ClassifierFitParams, ctx: HandlerContext):
            request = ClassifierFitRequest.model_validate(params.model_dump(exclude={"progress_token"}))
            return await engine.classification_fit(request, ctx)

        async def classifier_predict(params: ClassifierPredictParams, ctx: HandlerContext):
            request = ClassifierPredictRequest.model_validate(params.model_dump(exclude={"progress_token"}))
            return await engine.classification_predict(request, ctx)

        async def classifier_evaluate(params: ClassifierRequest, _ctx: HandlerContext):
            return await engine.classification_evaluate(params.classifier_id)

        async def accept_predictions(params: ClassificationTargetRequest, _ctx: HandlerContext):
            return await engine.classification_accept_predictions(params.target_id)

        async def clear_predictions(params: ClassificationTargetRequest, _ctx: HandlerContext):
            return await engine.classification_clear_predictions(params.target_id)

        async def classifier_export(params: ClassifierRequest, _ctx: HandlerContext):
            return await engine.classification_export(params.classifier_id)

        async def ingest_open(params: IngestOpenParams, _ctx: HandlerContext):
            result = await engine.ingest_open(params.expected)
            self._uploads.setdefault(peer, set()).add(result.upload_id)
            return result

        async def ingest_put(params: IngestPutParams, _ctx: HandlerContext):
            return await engine.ingest_put(params.upload_id, params.file)

        async def ingest_close(params: IngestCloseParams, _ctx: HandlerContext):
            self._uploads.get(peer, set()).discard(params.upload_id)
            return await engine.ingest_close(params.upload_id, params.cancelled)

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
        peer.on_request(
            "measurements/table", typed(MeasurementTableRequest, lambda p, _ctx: engine.measurement_table(p))
        )
        peer.on_request("measurements/compute", typed(MeasurementsComputeParams, measurements_compute))
        peer.on_request("images/delete", typed(ImagesDeleteParams, images_delete))
        peer.on_request("annotations/delete", typed(AnnotationsDeleteParams, annotations_delete))
        peer.on_request("images/categorize", typed(ImagesCategorizeParams, images_categorize))
        peer.on_request("annotations/categorize", typed(AnnotationsCategorizeParams, annotations_categorize))
        peer.on_request("categories/create", typed(CategoriesCreateParams, categories_create))
        peer.on_request("categories/update", typed(CategoryUpdateParams, categories_update))
        peer.on_request("categories/delete", typed(CategoriesDeleteParams, categories_delete))
        peer.on_request("annotations/commit", typed(AnnotationsCommitParams, annotations_commit))
        peer.on_request("annotations/update", typed(AnnotationsUpdateParams, annotations_update))
        peer.on_request("images/update", typed(ImagesUpdateParams, images_update))
        peer.on_request("kinds/create", typed(KindsCreateParams, kinds_create))
        peer.on_request("kinds/update", typed(KindUpdateParams, kinds_update))
        peer.on_request("kinds/delete", typed(KindsDeleteParams, kinds_delete))
        peer.on_request("project/update", typed(ProjectUpdateParams, project_update))
        peer.on_request("ingest/open", typed(IngestOpenParams, ingest_open))
        peer.on_request("ingest/put", typed(IngestPutParams, ingest_put))
        peer.on_request("ingest/close", typed(IngestCloseParams, ingest_close))
        peer.on_request("render/image", typed(RenderImageParams, render_image))
        peer.on_request("render/thumbnails", typed(RenderThumbnailsParams, render_thumbnails))
        peer.on_request("jobs/list", typed(None, jobs_list))
        peer.on_request("jobs/cancel", typed(JobsCancelParams, jobs_cancel))
        peer.on_request("segmentation/listModels", typed(None, list_models))
        peer.on_request("segmentation/loadModel", typed(LoadModelParams, load_model))
        peer.on_request("segmentation/run", typed(SegmentationRunParams, run))
        peer.on_request("classification/listArchitectures", typed(None, list_architectures))
        peer.on_request("classification/list", typed(None, list_classifiers))
        peer.on_request(
            "classification/create",
            typed(ClassifierCreateRequest, lambda p, _ctx: engine.classification_create(p)),
        )
        peer.on_request(
            "classification/update",
            typed(ClassifierUpdateRequest, lambda p, _ctx: engine.classification_update(p)),
        )
        peer.on_request("classification/delete", typed(ClassifierRequest, classifier_delete))
        peer.on_request("classification/fit", typed(ClassifierFitParams, classifier_fit))
        peer.on_request("classification/predict", typed(ClassifierPredictParams, classifier_predict))
        peer.on_request("classification/evaluate", typed(ClassifierRequest, classifier_evaluate))
        peer.on_request(
            "classification/acceptPredictions", typed(ClassificationTargetRequest, accept_predictions)
        )
        peer.on_request(
            "classification/clearPredictions", typed(ClassificationTargetRequest, clear_predictions)
        )
        peer.on_request("classification/export", typed(ClassifierRequest, classifier_export))
        peer.on_request(
            "classification/import",
            typed(ClassifierImportRequest, lambda p, _ctx: engine.classification_import(p)),
        )
