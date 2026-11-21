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
from piximi_schema.classification import (
    AnnotationUpdate,
    ChangedResult,
    Classifier,
    ClassifierCreateRequest,
    ClassifierExportResult,
    ClassifierFitRequest,
    ClassifierFitSummary,
    ClassifierImportRequest,
    ClassifierPredictRequest,
    ClassifierPredictSummary,
    ClassifierUpdateRequest,
    EvaluationResult,
)
from piximi_schema.editing import (
    AnnotationChangeSet,
    CommitResult,
    ImageChange,
)
from piximi_schema.entities import Category, Experiment, ImageObject, Kind
from piximi_schema.events import (
    AnnotationsDidAdd,
    AnnotationsDidRemove,
    AnnotationsDidUpdate,
    CategoriesDidChange,
    ClassifiersDidChange,
    ClassifiersDidEpoch,
    ImagesDidAdd,
    ImagesDidChange,
    ImagesDidRemove,
    ImagesDidUpdate,
    JobsDidUpdate,
    KindsDidAdd,
    KindsDidChange,
    KindsDidRemove,
    KindWithCategory,
    ModelsDidChange,
    ProjectDidChange,
)
from piximi_schema.exports import AnnotationsExportRequest, FileExport
from piximi_schema.ingest import (
    AddPathsParams,
    DirectoryListing,
    IngestOpenResult,
    IngestPutResult,
    IngestSummary,
    PathInspection,
    UploadFile,
)
from piximi_schema.jobs import Job
from piximi_schema.measurements import (
    MeasurementsComputeRequest,
    MeasurementsComputeSummary,
    MeasurementTable,
    MeasurementTableRequest,
)
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
    | KindsDidChange
    | KindsDidRemove
    | AnnotationsDidAdd
    | JobsDidUpdate
    | ImagesDidAdd
    | ImagesDidChange
    | ModelsDidChange
    | ImagesDidRemove
    | AnnotationsDidRemove
    | ImagesDidUpdate
    | AnnotationsDidUpdate
    | CategoriesDidChange
    | ProjectDidChange
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

    async def measurement_table(self, request: MeasurementTableRequest) -> MeasurementTable:
        """A scope's measurements as columns; see ``piximi_schema.measurements``."""
        ...

    async def measurements_compute(
        self, request: MeasurementsComputeRequest, ctx: HandlerContext
    ) -> MeasurementsComputeSummary:
        """Measures the matching objects as a job, announcing them as
        updated; see ``piximi_schema.measurements``."""
        ...

    # ── Ingest ──────────────────────────────────────────────────────────────

    async def ingest_open(self, expected: int) -> IngestOpenResult:
        """Starts an ``ingest`` job for a batch of ``expected`` uploaded
        files; see ``piximi_schema.ingest``."""
        ...

    async def ingest_put(self, upload_id: str, file: UploadFile) -> IngestPutResult:
        """Decodes and adds one file of the batch, announcing its images as
        ``images/didAdd``; a file that fails is reported in the result, not
        raised. Raises ``RequestCancelled`` once the job was cancelled."""
        ...

    async def ingest_close(self, upload_id: str, cancelled: bool = False) -> IngestSummary:
        """Ends the batch and its job (cancelled when the client says so or
        the job was cancelled meanwhile); returns what the batch added."""
        ...

    async def ingest_browse(self, path: str | None) -> DirectoryListing:
        """Lists a folder under the engine's roots (``ingest.paths``); no
        path lists the roots. Outside the roots: ``UNAUTHORIZED``."""
        ...

    async def ingest_inspect(self, paths: list[str]) -> list[PathInspection]:
        """What the decoder will make of each file: its frame count and the
        layout its metadata declares, so a client can ask about the rest."""
        ...

    async def ingest_add_paths(self, params: AddPathsParams, ctx: HandlerContext) -> IngestSummary:
        """Adds the files (and folders' supported files) as an ``ingest``
        job, skipping sources imported before; announces ``images/didAdd``."""
        ...

    # ── Export ──────────────────────────────────────────────────────────────

    async def export_annotations(self, request: AnnotationsExportRequest, ctx: HandlerContext) -> FileExport:
        """The matching objects as a file in one of the export formats
        (``export.annotations``); see ``piximi_schema.exports``."""
        ...

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

    # ── Editing ─────────────────────────────────────────────────────────────

    async def annotations_commit(self, changeset: AnnotationChangeSet, ctx: HandlerContext) -> CommitResult:
        """Applies a viewing session's changes atomically, refusing the whole
        set with the conflicts when a ``baseRev`` has moved (unless forced);
        measures created and redrawn objects; announces ``annotations/didAdd``,
        ``annotations/didUpdate`` (headers for redrawn objects) and
        ``annotations/didRemove``. See ``piximi_schema.editing``."""
        ...

    async def annotations_update(self, updates: list[AnnotationUpdate]) -> int:
        """Sets partitions by hand; announces ``annotations/didUpdate``."""
        ...

    async def images_update(self, updates: list[ImageChange]) -> list[ImageObject]:
        """Renames, re-partitions or changes the active plane of images;
        announces ``images/didChange``; returns the images as they are now."""
        ...

    async def kinds_create(self, kinds: list[KindWithCategory]) -> list[Kind]:
        """Adds kinds with their unknown categories; announces ``kinds/didAdd``."""
        ...

    async def kinds_update(self, id: str, name: str) -> Kind:
        """Renames a kind; announces ``kinds/didChange``."""
        ...

    async def kinds_delete(self, ids: list[str]) -> int:
        """Removes kinds with their categories and classifiers, moving their
        objects to the reserved unknown kind; the reserved kind stays.
        Announces ``annotations/didUpdate``, ``categories/didChange``,
        ``classifiers/didChange`` and ``kinds/didRemove``. Returns how many."""
        ...

    async def project_update(self, name: str) -> Experiment:
        """Renames the project; announces ``project/didChange``."""
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

    # ── Classification ──────────────────────────────────────────────────────
    #
    # Present when ``classification`` is among the capabilities. A classifier
    # belongs to a target: the project's images, or one kind's objects.

    async def classification_list_architectures(self) -> list[ModelDescriptor]:
        """Listed models with a classification task."""
        ...

    async def classification_list(self) -> list[Classifier]: ...

    async def classification_create(self, request: ClassifierCreateRequest) -> Classifier: ...

    async def classification_update(self, request: ClassifierUpdateRequest) -> Classifier: ...

    async def classification_delete(self, classifier_id: str) -> None: ...

    async def classification_fit(self, request: ClassifierFitRequest, ctx: HandlerContext) -> ClassifierFitSummary:
        """Splits the target's labeled items, writes their partitions, trains
        with each epoch announced, evaluates, and records the run."""
        ...

    async def classification_predict(
        self, request: ClassifierPredictRequest, ctx: HandlerContext
    ) -> ClassifierPredictSummary:
        """Writes predictions for the target's unlabeled items; they stay in
        the inference partition until accepted or cleared."""
        ...

    async def classification_evaluate(self, classifier_id: str) -> EvaluationResult: ...

    async def classification_accept_predictions(self, target_id: str) -> ChangedResult: ...

    async def classification_clear_predictions(self, target_id: str) -> ChangedResult: ...

    async def classification_export(self, classifier_id: str) -> ClassifierExportResult: ...

    async def classification_import(self, request: ClassifierImportRequest) -> Classifier: ...
