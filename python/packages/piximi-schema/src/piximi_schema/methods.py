"""Every method and notification in the protocol, with its payload types.

This is what the bundle's ``methods`` and ``notifications`` sections are built
from, and what the frontend's ``ProtocolMethods`` map is generated from.
"""

from dataclasses import dataclass
from typing import Literal

from .base import WireModel
from .classification import (
    ChangedResult,
    ClassificationTargetRequest,
    Classifier,
    ClassifierCreateRequest,
    ClassifierExportResult,
    ClassifierFitRequest,
    ClassifierFitSummary,
    ClassifierImportRequest,
    ClassifierPredictRequest,
    ClassifierPredictSummary,
    ClassifierRequest,
    ClassifiersResult,
    ClassifierUpdateRequest,
    EvaluationResult,
)
from .editing import (
    AnnotationsCommitParams,
    AnnotationsUpdateParams,
    CommitResult,
    ExperimentResult,
    ImagesResult,
    ImagesUpdateParams,
    KindsCreateParams,
    KindsDeleteParams,
    KindsResult,
    KindUpdateParams,
    ProjectUpdateParams,
)
from .entities import Category
from .events import EVENT_TYPES
from .exports import AnnotationsExportRequest, FileExport
from .ingest import (
    AddPathsParams,
    BrowseParams,
    DirectoryListing,
    IngestCloseParams,
    IngestOpenParams,
    IngestOpenResult,
    IngestPutParams,
    IngestPutResult,
    IngestSummary,
    InspectParams,
    InspectResult,
)
from .jobs import Job
from .measurements import (
    MeasurementsComputeRequest,
    MeasurementsComputeSummary,
    MeasurementTable,
    MeasurementTableRequest,
)
from .query import (
    AnnotationCountGroup,
    AnnotationPage,
    AnnotationQuery,
    AnnotationSort,
    CountsResult,
    IdsResult,
    ImageCountGroup,
    ImagePage,
    ImageQuery,
    ImageSort,
    MasksResult,
    PageRequest,
    ProjectSummary,
)
from .render import RenderedImage, RenderRequest, ThumbnailsPartial
from .rpc import CancelParams, ProgressParams, ProgressValue
from .segmentation import (
    ModelDescriptor,
    SegmentationRunRequest,
    SegmentationRunSummary,
)
from .session import InitializeParams, InitializeResult

Direction = Literal["client->server", "server->client"]


# ── Params / results that exist only to name a method's payload ─────────────


class ImagesParams(WireModel):
    query: ImageQuery
    sort: ImageSort | None = None
    page: PageRequest


class ImageIdsParams(WireModel):
    query: ImageQuery
    sort: ImageSort | None = None


class ImageCountsParams(WireModel):
    query: ImageQuery
    group_by: ImageCountGroup | None = None


class AnnotationsParams(WireModel):
    query: AnnotationQuery
    sort: AnnotationSort | None = None
    page: PageRequest


class AnnotationIdsParams(WireModel):
    query: AnnotationQuery
    sort: AnnotationSort | None = None


class AnnotationCountsParams(WireModel):
    query: AnnotationQuery
    group_by: AnnotationCountGroup | None = None


class MasksParams(WireModel):
    annotation_ids: list[str]


class ImagesDeleteParams(WireModel):
    query: ImageQuery
    """Every image the query matches goes, with its planes, channels and objects."""


class AnnotationsDeleteParams(WireModel):
    query: AnnotationQuery
    """Every annotation the query matches goes; a volume left empty goes too."""


class DeletedResult(WireModel):
    deleted: int


class CategoriesCreateParams(WireModel):
    categories: list[Category]
    """Made by the client with fresh ids; the backend keeps them as given."""


class CategoryUpdateParams(WireModel):
    id: str
    name: str | None = None
    color: str | None = None


class CategoriesDeleteParams(WireModel):
    ids: list[str]
    """Items of a deleted category return to the unknown one; the reserved
    unknown categories cannot be deleted."""


class CategoriesResult(WireModel):
    categories: list[Category]


class ImagesCategorizeParams(WireModel):
    query: ImageQuery
    category_id: str


class AnnotationsCategorizeParams(WireModel):
    query: AnnotationQuery
    category_id: str


class ClassifierFitParams(ClassifierFitRequest):
    progress_token: str | None = None


class ClassifierPredictParams(ClassifierPredictRequest):
    progress_token: str | None = None


class MeasurementsComputeParams(MeasurementsComputeRequest):
    progress_token: str | None = None


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
    models: list[ModelDescriptor]


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
    MethodSpec("query/imageIds", ImageIdsParams, IdsResult),
    MethodSpec("query/imageCounts", ImageCountsParams, CountsResult),
    MethodSpec("query/annotations", AnnotationsParams, AnnotationPage),
    MethodSpec("query/annotationIds", AnnotationIdsParams, IdsResult),
    MethodSpec("query/annotationCounts", AnnotationCountsParams, CountsResult),
    MethodSpec("query/masks", MasksParams, MasksResult),
    MethodSpec("measurements/table", MeasurementTableRequest, MeasurementTable),
    MethodSpec(
        "measurements/compute",
        MeasurementsComputeParams,
        MeasurementsComputeSummary,
        progress=ProgressValue,
    ),
    MethodSpec("images/delete", ImagesDeleteParams, DeletedResult),
    MethodSpec("annotations/delete", AnnotationsDeleteParams, DeletedResult),
    MethodSpec("images/categorize", ImagesCategorizeParams, ChangedResult),
    MethodSpec("annotations/categorize", AnnotationsCategorizeParams, ChangedResult),
    MethodSpec("categories/create", CategoriesCreateParams, CategoriesResult),
    MethodSpec("categories/update", CategoryUpdateParams, CategoriesResult),
    MethodSpec("categories/delete", CategoriesDeleteParams, DeletedResult),
    MethodSpec("annotations/commit", AnnotationsCommitParams, CommitResult, progress=ProgressValue),
    MethodSpec("annotations/update", AnnotationsUpdateParams, ChangedResult),
    MethodSpec("images/update", ImagesUpdateParams, ImagesResult),
    MethodSpec("kinds/create", KindsCreateParams, KindsResult),
    MethodSpec("kinds/update", KindUpdateParams, KindsResult),
    MethodSpec("kinds/delete", KindsDeleteParams, DeletedResult),
    MethodSpec("project/update", ProjectUpdateParams, ExperimentResult),
    MethodSpec("ingest/open", IngestOpenParams, IngestOpenResult),
    MethodSpec("ingest/put", IngestPutParams, IngestPutResult),
    MethodSpec("ingest/close", IngestCloseParams, IngestSummary),
    MethodSpec("ingest/browse", BrowseParams, DirectoryListing),
    MethodSpec("ingest/inspect", InspectParams, InspectResult),
    MethodSpec("ingest/addPaths", AddPathsParams, IngestSummary, progress=ProgressValue),
    MethodSpec("export/annotations", AnnotationsExportRequest, FileExport, progress=ProgressValue),
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
    MethodSpec("classification/listArchitectures", None, ListModelsResult),
    MethodSpec("classification/list", None, ClassifiersResult),
    MethodSpec("classification/create", ClassifierCreateRequest, Classifier),
    MethodSpec("classification/update", ClassifierUpdateRequest, Classifier),
    MethodSpec("classification/delete", ClassifierRequest, None),
    MethodSpec("classification/fit", ClassifierFitParams, ClassifierFitSummary, progress=ProgressValue),
    MethodSpec(
        "classification/predict",
        ClassifierPredictParams,
        ClassifierPredictSummary,
        progress=ProgressValue,
    ),
    MethodSpec("classification/evaluate", ClassifierRequest, EvaluationResult),
    MethodSpec("classification/acceptPredictions", ClassificationTargetRequest, ChangedResult),
    MethodSpec("classification/clearPredictions", ClassificationTargetRequest, ChangedResult),
    MethodSpec("classification/export", ClassifierRequest, ClassifierExportResult),
    MethodSpec("classification/import", ClassifierImportRequest, Classifier),
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
