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
from piximi_schema.exports import AnnotationsExportRequest
from piximi_schema.project import (
    ProjectCreateParams,
    ProjectExportParams,
    ProjectIdParams,
    ProjectImportParams,
    ProjectsResult,
)
from piximi_schema.ingest import (
    AddPathsParams,
    BrowseParams,
    IngestCloseParams,
    IngestOpenParams,
    IngestPutParams,
    InspectParams,
    InspectResult,
)
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
        self._trusted: set[Peer] = set()
        """Peers whose connection already authenticated them (see ``attach``)."""
        self._initialized: set[Peer] = set()
        """Peers that passed ``initialize``: the only ones served or told of events."""
        self._uploads: dict[Peer, set[str]] = {}
        """Uploads each peer has open, closed as cancelled if it goes away."""
        self._unsubscribe = engine.subscribe(self._broadcast)

    @property
    def peers(self) -> frozenset[Peer]:
        return frozenset(self._peers)

    def attach(self, peer: Peer, *, trusted: bool = False) -> None:
        """Serves the protocol on ``peer`` until it closes. Until it calls
        ``initialize`` with a valid ticket, every other request is refused.
        A ``trusted`` peer arrived over a connection that authenticated it
        already, so its ``initialize`` needs no ticket (it still checks the
        protocol version)."""
        self._peers.add(peer)
        if trusted:
            self._trusted.add(peer)
        self._register(peer)
        peer.on_notification("initialized", lambda _params: None)
        peer.on_notification("$/ping", lambda _params: None)

    def detach(self, peer: Peer) -> None:
        self._peers.discard(peer)
        self._trusted.discard(peer)
        self._initialized.discard(peer)
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
        self._trusted.clear()
        self._initialized.clear()

    # ── Events ──────────────────────────────────────────────────────────────

    def _broadcast(self, event: BackendEvent) -> None:
        wire = event.to_wire()
        for peer in list(self._peers):
            if peer.closed:
                self.detach(peer)
                continue
            if peer in self._initialized:
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

        def serve(method: str, handler: Handler) -> None:
            if method == "initialize":
                peer.on_request(method, handler)
                return

            async def gated(params: Any, ctx: HandlerContext) -> Any:
                if peer not in self._initialized:
                    raise BackendError("UNAUTHORIZED", f"Call initialize before {method}")
                return await handler(params, ctx)

            peer.on_request(method, gated)

        async def initialize(params: InitializeParams, _ctx: HandlerContext) -> InitializeResult:
            ticket = params.auth.ticket if params.auth else None
            if peer not in self._trusted and not self.auth.redeem(ticket):
                raise BackendError("UNAUTHORIZED", "A valid session ticket is required")
            if _major(params.protocol_version) != _major(PROTOCOL_VERSION):
                raise BackendError(
                    "NOT_SUPPORTED",
                    f"Protocol {params.protocol_version} is not supported; "
                    f"this server speaks {PROTOCOL_VERSION}",
                )
            self._initialized.add(peer)
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
            # An engine with a workspace renames its registry entry as well.
            rename = getattr(engine, "project_rename", engine.project_update)
            return ExperimentResult(experiment=await rename(params.name))

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

        async def ingest_browse(params: BrowseParams, _ctx: HandlerContext):
            return await engine.ingest_browse(params.path)

        async def ingest_inspect(params: InspectParams, _ctx: HandlerContext):
            return InspectResult(files=await engine.ingest_inspect(params.paths))

        async def ingest_add_paths(params: AddPathsParams, ctx: HandlerContext):
            return await engine.ingest_add_paths(params, ctx)

        async def export_annotations(params: AnnotationsExportRequest, ctx: HandlerContext):
            return await engine.export_annotations(params, ctx)

        async def project_list(_ctx: HandlerContext):
            return ProjectsResult(projects=await engine.project_list())

        async def project_create(params: ProjectCreateParams, _ctx: HandlerContext):
            return await engine.project_create(params.name)

        async def project_open(params: ProjectIdParams, _ctx: HandlerContext):
            return await engine.project_open(params.id)

        async def project_delete(params: ProjectIdParams, _ctx: HandlerContext):
            await engine.project_delete(params.id)
            return None

        async def project_import(params: ProjectImportParams, ctx: HandlerContext):
            return await engine.project_import(params, ctx)

        async def project_export(params: ProjectExportParams, ctx: HandlerContext):
            return await engine.project_export(params, ctx)

        serve("initialize", typed(InitializeParams, initialize))
        serve("shutdown", typed(None, shutdown))
        serve("query/project", typed(None, lambda _ctx: engine.project()))
        serve("query/images", typed(ImagesParams, images))
        serve("query/imageIds", typed(ImageIdsParams, image_ids))
        serve("query/imageCounts", typed(ImageCountsParams, image_counts))
        serve("query/annotations", typed(AnnotationsParams, annotations))
        serve("query/annotationIds", typed(AnnotationIdsParams, annotation_ids))
        serve("query/annotationCounts", typed(AnnotationCountsParams, annotation_counts))
        serve("query/masks", typed(MasksParams, masks))
        serve(
            "measurements/table", typed(MeasurementTableRequest, lambda p, _ctx: engine.measurement_table(p))
        )
        serve("measurements/compute", typed(MeasurementsComputeParams, measurements_compute))
        serve("images/delete", typed(ImagesDeleteParams, images_delete))
        serve("annotations/delete", typed(AnnotationsDeleteParams, annotations_delete))
        serve("images/categorize", typed(ImagesCategorizeParams, images_categorize))
        serve("annotations/categorize", typed(AnnotationsCategorizeParams, annotations_categorize))
        serve("categories/create", typed(CategoriesCreateParams, categories_create))
        serve("categories/update", typed(CategoryUpdateParams, categories_update))
        serve("categories/delete", typed(CategoriesDeleteParams, categories_delete))
        serve("annotations/commit", typed(AnnotationsCommitParams, annotations_commit))
        serve("annotations/update", typed(AnnotationsUpdateParams, annotations_update))
        serve("images/update", typed(ImagesUpdateParams, images_update))
        serve("kinds/create", typed(KindsCreateParams, kinds_create))
        serve("kinds/update", typed(KindUpdateParams, kinds_update))
        serve("kinds/delete", typed(KindsDeleteParams, kinds_delete))
        serve("project/update", typed(ProjectUpdateParams, project_update))
        serve("ingest/open", typed(IngestOpenParams, ingest_open))
        serve("ingest/put", typed(IngestPutParams, ingest_put))
        serve("ingest/close", typed(IngestCloseParams, ingest_close))
        serve("ingest/browse", typed(BrowseParams, ingest_browse))
        serve("ingest/inspect", typed(InspectParams, ingest_inspect))
        serve("ingest/addPaths", typed(AddPathsParams, ingest_add_paths))
        serve("export/annotations", typed(AnnotationsExportRequest, export_annotations))
        serve("project/list", typed(None, project_list))
        serve("project/create", typed(ProjectCreateParams, project_create))
        serve("project/open", typed(ProjectIdParams, project_open))
        serve("project/delete", typed(ProjectIdParams, project_delete))
        serve("project/import", typed(ProjectImportParams, project_import))
        serve("project/export", typed(ProjectExportParams, project_export))
        serve("render/image", typed(RenderImageParams, render_image))
        serve("render/thumbnails", typed(RenderThumbnailsParams, render_thumbnails))
        serve("jobs/list", typed(None, jobs_list))
        serve("jobs/cancel", typed(JobsCancelParams, jobs_cancel))
        serve("segmentation/listModels", typed(None, list_models))
        serve("segmentation/loadModel", typed(LoadModelParams, load_model))
        serve("segmentation/run", typed(SegmentationRunParams, run))
        serve("classification/listArchitectures", typed(None, list_architectures))
        serve("classification/list", typed(None, list_classifiers))
        serve(
            "classification/create",
            typed(ClassifierCreateRequest, lambda p, _ctx: engine.classification_create(p)),
        )
        serve(
            "classification/update",
            typed(ClassifierUpdateRequest, lambda p, _ctx: engine.classification_update(p)),
        )
        serve("classification/delete", typed(ClassifierRequest, classifier_delete))
        serve("classification/fit", typed(ClassifierFitParams, classifier_fit))
        serve("classification/predict", typed(ClassifierPredictParams, classifier_predict))
        serve("classification/evaluate", typed(ClassifierRequest, classifier_evaluate))
        serve(
            "classification/acceptPredictions", typed(ClassificationTargetRequest, accept_predictions)
        )
        serve(
            "classification/clearPredictions", typed(ClassificationTargetRequest, clear_predictions)
        )
        serve("classification/export", typed(ClassifierRequest, classifier_export))
        serve(
            "classification/import",
            typed(ClassifierImportRequest, lambda p, _ctx: engine.classification_import(p)),
        )
