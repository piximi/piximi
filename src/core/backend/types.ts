import type {
  AnnotationCategory,
  AnnotationObject,
  AnnotationVolume,
  BBox,
  BitDepth,
  Category,
  Channel,
  ChannelMeta,
  ColorMap,
  Experiment,
  ImageObject,
  ImageSeries,
  Kind,
  Partition,
  Plane,
  Predictable,
} from "core/entities";
import type {
  Classifier,
  ClassifierHyperparameters,
  EvaluationResult,
  ModelClassMap,
  RunStatus,
} from "core/dl/classification/types";
import type {
  ModelDisplayInfo,
  OutputPolicy,
  SegmentationModelDetails,
  SegmenterOptionValues,
} from "core/dl/segmentation/types";

import type { Capability } from "./capabilities";
import type { BackendEventListener } from "./events";
import type { Job } from "./jobs";

/*
 * The seam between the UI and wherever pixels, models and measurements live.
 * `LocalBackend` implements it over the in-browser workers and IndexedDB;
 * `RemoteBackend` over an RPC connection. Methods reject with `BackendError`
 * on failure and `TaskCancelledError` on cancellation; results of long
 * operations arrive as events (see `events.ts`) rather than return values, so
 * every client of a session sees them.
 *
 * Optional domains (`segmentation`, ...) are present exactly when the matching
 * capability is declared.
 */
export interface Backend {
  readonly kind: BackendKind;
  readonly capabilities: readonly Capability[];
  readonly session: BackendSession;

  connect(): Promise<void>;
  dispose(): Promise<void>;
  subscribe(listener: BackendEventListener): () => void;

  readonly query: BackendQuery;
  readonly render: BackendRender;
  readonly jobs: BackendJobs;
  readonly images: BackendImages;
  readonly annotations: BackendAnnotations;
  readonly categories: BackendCategories;
  readonly kinds: BackendKinds;
  readonly project: BackendProject;
  readonly segmentation?: BackendSegmentation;
  readonly classification?: BackendClassification;
  readonly measurements?: BackendMeasurements;
  /* Present with `ingest.upload`. */
  readonly ingest?: BackendIngest;
}

export type BackendKind = "local" | "remote";

export type BackendSession = {
  id: string;
  protocolVersion: string;
  /* The engine a remote session is served by; absent for the local backend. */
  server?: { name: string; version: string; url?: string };
};

export type ProgressUpdate = {
  /* 0–100, or -1 while indeterminate. */
  percent: number;
  message: string;
};

export type CallOptions = {
  signal?: AbortSignal;
  onProgress?: (update: ProgressUpdate) => void;
};

// ── Query ────────────────────────────────────────────────────────────────────
//
// Listings are filtered, sorted and paged by the backend. A page addresses a
// window of the result by position and carries the result's total, which is
// what a virtualized grid needs; the backend's events say when a window has
// to be fetched again. Ties in every sort fall back to insertion order, and
// `desc` reverses the whole order, ties included.

export type PageRequest = { offset?: number; limit: number };

export type Page<T> = { items: T[]; total: number };

export type SortDirection = "asc" | "desc";

/* Keeps items whose confidence lies strictly inside the range; items without
 * one are left out. */
export type ConfidenceRange = { min: number; max: number };

export type ImageSortKey = "none" | "name" | "category" | "random" | "softmax";

/* `random` shuffles by `seed`, the same way on every backend. `softmax` puts
 * the least confident classifier prediction first and needs the
 * `classification` capability. */
export type ImageSort = {
  key?: ImageSortKey;
  direction?: SortDirection;
  seed?: number;
};

/* Every condition given must hold; an absent one does not restrict. */
export type ImageQuery = {
  ids?: string[];
  seriesIds?: string[];
  categoryIds?: string[];
  partitions?: Partition[];
  confidence?: ConfidenceRange;
  /* Only images with (`true`) or without (`false`) any annotation. */
  annotated?: boolean;
};

export type ImageCountGroup = "category" | "partition";

export type ImageRecord = {
  image: ImageObject;
  /* The series the image belongs to; several records may share one. */
  series: ImageSeries;
  planes: Plane[];
  channels: Channel[];
};

export type AnnotationSortKey =
  | "none"
  | "plane"
  | "volume"
  | "category"
  | "image"
  | "random"
  | "softmax";

export type AnnotationSort = {
  key?: AnnotationSortKey;
  direction?: SortDirection;
  seed?: number;
};

export type AnnotationQuery = {
  ids?: string[];
  imageIds?: string[];
  planeIds?: string[];
  volumeIds?: string[];
  kindIds?: string[];
  categoryIds?: string[];
  partitions?: Partition[];
  confidence?: ConfidenceRange;
};

export type AnnotationCountGroup = "category" | "partition" | "kind";

/* Masks are fetched separately (`masks`); they dominate the payload size. */
export type AnnotationHeader = Omit<
  AnnotationObject,
  "encodedMask" | "decodedMask"
>;

export type AnnotationRecord = {
  volume: AnnotationVolume;
  annotation: AnnotationHeader;
};

export type Counts = {
  total: number;
  /* Matches per category id, partition or kind id, when grouping was asked
   * for; groups with no match are absent. */
  groups?: Record<string, number>;
};

export type ProjectSummary = {
  experiment: Experiment;
  kinds: Kind[];
  categories: Category[];
  channelMetas: ChannelMeta[];
  counts: { images: number; annotations: number };
};

export interface BackendQuery {
  project(): Promise<ProjectSummary>;
  images(
    query: ImageQuery,
    page: PageRequest,
    sort?: ImageSort,
  ): Promise<Page<ImageRecord>>;
  /* Every match, in order: for select-all and for running over a listing. */
  imageIds(query: ImageQuery, sort?: ImageSort): Promise<string[]>;
  imageCounts(query: ImageQuery, groupBy?: ImageCountGroup): Promise<Counts>;
  annotations(
    query: AnnotationQuery,
    page: PageRequest,
    sort?: AnnotationSort,
  ): Promise<Page<AnnotationRecord>>;
  annotationIds(
    query: AnnotationQuery,
    sort?: AnnotationSort,
  ): Promise<string[]>;
  annotationCounts(
    query: AnnotationQuery,
    groupBy?: AnnotationCountGroup,
  ): Promise<Counts>;
  masks(annotationIds: string[]): Promise<Record<string, number[]>>;
}

// ── Render ───────────────────────────────────────────────────────────────────

/* Per-client display settings travel with every request; they are not state. */
export type ChannelDisplay = {
  channelId: string;
  colorMap: ColorMap;
  rampMin: number;
  rampMax: number;
  visible: boolean;
};

export type RenderRequest = {
  /* All channels of one plane; hidden ones are skipped. */
  channels: ChannelDisplay[];
  region?: BBox;
  scale?: number;
};

export type RenderedImage = { width: number; height: number; dataUrl: string };

export type RenderResult = { index: number } & (
  | { ok: true; image: RenderedImage }
  | { ok: false; error: Error }
);

export type RawChannelData = {
  channelId: string;
  bitDepth: BitDepth;
  width: number;
  height: number;
  data: Uint8Array<ArrayBuffer> | Uint16Array<ArrayBuffer>;
};

export interface BackendRender {
  image(request: RenderRequest, options?: CallOptions): Promise<RenderedImage>;
  /* Yields in completion order; `index` ties a result to its request. */
  thumbnails(
    requests: RenderRequest[],
    options?: CallOptions,
  ): AsyncIterable<RenderResult>;
  /* Only with the `raw-local` capability. */
  raw?(channelIds: string[]): Promise<RawChannelData[]>;
}

// ── Mutations ────────────────────────────────────────────────────────────────
//
// Scoped like the listings: a query says what goes, so "the selection" and
// "everything in this category" are the same call. The backend announces what
// went as `images/didRemove` / `annotations/didRemove`, and what changed as
// `images/didUpdate` / `annotations/didUpdate`.

export type Deleted = { deleted: number };

export type Changed = { changed: number };

/*
 * What a categorization or a prediction changed, as partial records: the
 * fields a category change always rewrites. An absent prediction field was
 * cleared. For objects, the category and prediction live on the volume and
 * the partition on each annotation.
 */
export type ImageUpdate = Predictable & { id: string; categoryId: string };

export type VolumeUpdate = Omit<Predictable, "partition"> & {
  id: string;
  kindId: string;
  categoryId: string;
  /* The volume's revision after the change, so a copy held by a viewing
   * session can commit against it later without a spurious conflict. */
  rev?: number;
};

export type AnnotationUpdate = { id: string; partition: Partition };

/* Fields of an image a user edits directly; absent ones stay. */
export type ImageChange = {
  id: string;
  name?: string;
  partition?: Partition;
  activePlaneId?: string;
};

export interface BackendImages {
  /* Each image with its planes, channels and objects. */
  delete(query: ImageQuery): Promise<Deleted>;
  /* Moves every match to the category. A hand-made change: the shared
   * partition and correction rules apply (`core/entities/prediction.ts`). */
  categorize(query: ImageQuery, categoryId: string): Promise<Changed>;
  /* Renames, re-partitions or changes the active plane; announced as
   * `images/didChange`. Resolves with the images as they are now. */
  update(updates: ImageChange[]): Promise<ImageObject[]>;
}

// ── Editing ──────────────────────────────────────────────────────────────────
//
// A viewing session edits a copy of a few images' annotations and commits
// the difference in one changeset. Entries that touch existing rows carry
// the revision they were read at (`baseRev`); the backend refuses the whole
// set with the conflicts when any has moved meanwhile, unless `force`d.

/* An existing row and the revision it was read at; without `baseRev` the
 * check is skipped (a backend without revisions). */
export type EntityRef = { id: string; baseRev?: number };

/* A recategorized object: the kind follows the category and every
 * annotation of the volume follows the partition rule, as `categorize`. */
export type VolumeCategoryChange = EntityRef & { categoryId: string };

/* A redrawn object: the box and the mask cropped to it. The backend derives
 * the shape and measures the object again. */
export type AnnotationGeometryChange = EntityRef & {
  boundingBox: BBox;
  encodedMask: number[];
};

export type AnnotationChangeSet = {
  /* The images the session edited; every entry belongs to one of them. */
  imageIds: string[];
  volumes: {
    /* Made by the caller with fresh ids; kept as given. */
    created: AnnotationVolume[];
    updated: VolumeCategoryChange[];
    /* A volume left without annotations goes regardless. */
    deleted: EntityRef[];
  };
  annotations: {
    /* With their masks; measured by the backend. */
    created: AnnotationObject[];
    updated: AnnotationGeometryChange[];
    deleted: EntityRef[];
  };
  /* Apply even where a `baseRev` is stale; an entry whose row is gone is
   * skipped and listed. */
  force?: boolean;
};

export type CommitConflict = {
  type: "annotation" | "volume";
  id: string;
  /* `modified`: the row moved past `baseRev`; `missing`: the row is gone. */
  reason: "modified" | "missing";
};

/* A non-empty `conflicts` means nothing was applied, unless the changeset
 * was forced, when it lists what was skipped as missing. */
export type CommitResult = {
  created: number;
  updated: number;
  deleted: number;
  conflicts: CommitConflict[];
};

export interface BackendAnnotations {
  /* Each annotation, and any volume left without one. */
  delete(query: AnnotationQuery): Promise<Deleted>;
  /* Moves the volume of every match to the category, which also sets its
   * kind; every annotation of the volume follows the partition rule. */
  categorize(query: AnnotationQuery, categoryId: string): Promise<Changed>;
  /* Applies a session's changes atomically and measures what it made or
   * redrew, announcing `annotations/didAdd`, `annotations/didUpdate` (with
   * `headers` for redrawn objects) and `annotations/didRemove`. Progress
   * covers the measuring. */
  commit(
    changeSet: AnnotationChangeSet,
    options?: CallOptions,
  ): Promise<CommitResult>;
  /* Partitions set by hand; announced as `annotations/didUpdate`. */
  update(updates: AnnotationUpdate[]): Promise<Changed>;
}

export interface BackendKinds {
  /* Each with its unknown category, made by the caller with fresh ids;
   * announced as `kinds/didAdd`. */
  create(
    kinds: Array<{ kind: Kind; category: AnnotationCategory }>,
  ): Promise<Kind[]>;
  /* Renames; announced as `kinds/didChange`. */
  update(id: string, name: string): Promise<Kind>;
  /* Objects of a deleted kind return to the reserved unknown kind; its
   * categories and classifiers go with it. The reserved kind stays. */
  delete(ids: string[]): Promise<Deleted>;
}

export interface BackendProject {
  /* Renames the project; announced as `project/didChange`. */
  rename(name: string): Promise<Experiment>;
}

export interface BackendCategories {
  /* Made by the caller with fresh ids; kept as given. */
  create(categories: Category[]): Promise<Category[]>;
  update(
    id: string,
    changes: { name?: string; color?: string },
  ): Promise<Category>;
  /* Items of a deleted category return to the unknown one of their kind,
   * keeping their partitions; the reserved unknown categories stay. */
  delete(ids: string[]): Promise<Deleted>;
}

// ── Jobs ─────────────────────────────────────────────────────────────────────

export interface BackendJobs {
  list(): Promise<Job[]>;
  cancel(id: string): Promise<void>;
}

// ── Segmentation ─────────────────────────────────────────────────────────────

/*
 * Where a model is on the way to being usable. One that runs in its own
 * environment (a plugin on a remote engine) starts `unavailable` until that
 * environment is built; `loadModel` builds it as part of the load job.
 */
export type ModelStatus =
  | "unavailable"
  | "building"
  | "ready"
  | "loaded"
  | "failed";

/* What a model can do, named like the capabilities that expose it. */
export type ModelTask =
  | "segmentation"
  | "segmentation.train"
  | "classification"
  | "classification.train";

export type ModelResources = {
  /* Whether the model uses a GPU when one is available. */
  gpu: boolean;
  /* Free text, e.g. "2 GB VRAM". */
  memoryHint?: string;
};

/*
 * Any model a backend lists: a segmenter, or an architecture a classifier
 * can be built from. `tasks` says which; `outputPolicy` is present for
 * models that segment, and `channelPolicy` says what the model is fed.
 */
export type ModelDescriptor = Omit<SegmentationModelDetails, "outputPolicy"> &
  Omit<ModelDisplayInfo, "name" | "displayName"> & {
    outputPolicy?: OutputPolicy;
    status: ModelStatus;
    /* Why it is `unavailable` or `failed`, or what a build is doing. */
    statusMessage?: string;
    /* What runs the model, e.g. "cellcast", "pytorch", "tensorflow.js". */
    framework: string;
    version?: string;
    tasks: ModelTask[];
    resources?: ModelResources;
  };

export type SegmentationModelDescriptor = ModelDescriptor & {
  outputPolicy: OutputPolicy;
};

export type SegmentationRunRequest = {
  modelId: string;
  imageIds: string[];
  /* The channel metas to feed the model, in model-input order. */
  channelMetaIds: string[];
  options?: SegmenterOptionValues;
  kindName?: string;
};

export type SegmentationRunSummary = {
  /* Absent when the run was cancelled before it started, so no job exists. */
  jobId?: string;
  added: number;
  skipped: number;
  cancelled: boolean;
  /* Non-fatal problems, e.g. measurements that could not be computed. */
  warnings?: string[];
};

export interface BackendSegmentation {
  listModels(): Promise<SegmentationModelDescriptor[]>;
  loadModel(modelId: string, options?: CallOptions): Promise<void>;
  /*
   * Resolves once the run is finished and its results have been emitted as
   * `kinds/didAdd` / `annotations/didAdd` events. A cancelled run resolves
   * with `cancelled: true` and whatever it added before stopping.
   */
  run(
    request: SegmentationRunRequest,
    options?: CallOptions,
  ): Promise<SegmentationRunSummary>;
}

// ── Classification ───────────────────────────────────────────────────────────
//
// A classifier belongs to a target: the project's images, or one kind's
// objects. The backend owns its record (settings, class map, runs,
// predictions) and announces changes as `classifiers/didChange`, with each
// training epoch as `classifiers/didEpoch`; the classifier slice mirrors
// both. Fitting and predicting are jobs.

export type ClassifierCreateRequest = {
  targetId: string;
  name: string;
  /* A listed model with the `classification.train` task. */
  architectureId: string;
  hyperparameters: ClassifierHyperparameters;
  seed?: number;
};

/* Changes between runs; absent fields stay as they are. */
export type ClassifierUpdateRequest = {
  classifierId: string;
  hyperparameters?: ClassifierHyperparameters;
  classMap?: ModelClassMap;
  confidenceThreshold?: number;
};

/*
 * Trains on the target's labeled items. The backend splits those still
 * unassigned into training and validation per category by the
 * hyperparameters' percentage (shuffled by `seed`), records the partitions,
 * and announces each epoch.
 */
export type ClassifierFitRequest = { classifierId: string; seed?: number };

export type ClassifierFitSummary = {
  /* Absent when cancelled before anything started. */
  jobId?: string;
  runId?: string;
  status: RunStatus;
  evalResults?: EvaluationResult;
};

/*
 * Labels the target's unlabeled items, or just `ids`, with the classifier's
 * predictions; they stay in the inference partition until accepted or
 * cleared.
 */
export type ClassifierPredictRequest = { classifierId: string; ids?: string[] };

export type ClassifierPredictSummary = {
  jobId?: string;
  predicted: number;
  cancelled: boolean;
};

/* A zip: the framework's saved model, the runs and a manifest. */
export type ClassifierExport = {
  fileName: string;
  mime: string;
  data: Uint8Array;
};

export type ClassifierImportRequest = {
  targetId: string;
  data: Uint8Array;
  /* Overrides the name in the archive's manifest. */
  name?: string;
};

export type ClassifierUrlImportRequest = {
  targetId: string;
  /* Where tfjs finds the model's `model.json`. */
  url: string;
  format: "layers" | "graph";
};

// ── Measurements ─────────────────────────────────────────────────────────────

export type MeasurementScope = {
  type: "images" | "objects";
  /* The kind whose objects are tabled; required for `objects`. */
  kindId?: string;
};

export type MeasurementTableRequest = {
  scope: MeasurementScope;
  /* Keys from `measurements/columns`; an unknown one is refused. */
  columns: string[];
  /* Restricts an `images` scope. */
  imageQuery?: ImageQuery;
  /* Restricts an `objects` scope, within its kind. */
  annotationQuery?: AnnotationQuery;
  /* A window of the rows; absent is all of them. */
  page?: PageRequest;
};

/*
 * A scope's entities with the requested measurements as columns, aligned
 * with `ids`; a value no backend has computed is `null`.
 */
export type MeasurementTable = {
  ids: string[];
  /* For objects, the image each belongs to. */
  imageIds?: string[];
  imageNames: string[];
  categoryIds: string[];
  partitions: Partition[];
  timepoints: number[];
  /* For objects. */
  boundingBoxes?: BBox[];
  values: Record<string, (number | null)[]>;
  /* Rows the scope and query match, not of the page. */
  total: number;
};

/*
 * What to measure: the objects of a kind that lack features or intensities,
 * or the images whose channels lack statistics; `force` measures all of them.
 */
export type MeasurementsComputeRequest = {
  scope: MeasurementScope;
  /* Restricts an `objects` scope, within its kind. */
  annotationQuery?: AnnotationQuery;
  /* Restricts an `images` scope. */
  imageQuery?: ImageQuery;
  force?: boolean;
};

export type MeasurementsComputeSummary = {
  /* Absent when cancelled before it started, so no job exists. */
  jobId?: string;
  measured: number;
  cancelled: boolean;
};

export interface BackendMeasurements {
  table(
    request: MeasurementTableRequest,
    options?: CallOptions,
  ): Promise<MeasurementTable>;
  /* Measures what the scope lacks (an object's features and intensities
   * from its mask and pixels, an image's channel statistics) as a
   * `measurements` job, announcing the entities as updated. */
  compute(
    request: MeasurementsComputeRequest,
    options?: CallOptions,
  ): Promise<MeasurementsComputeSummary>;
}

// ── Ingest ───────────────────────────────────────────────────────────────────
//
// Images come in as files the backend decodes. A batch is one `ingest`
// job; each file is announced as `images/didAdd` when it lands, and one
// that cannot be decoded fails alone. The TIFF dimension config is worked
// out by the caller (from the file's metadata, or a dialog) and travels
// with the file.

export type DimensionOrder =
  | "xyczt"
  | "xyctz"
  | "xyzct"
  | "xyztc"
  | "xytcz"
  | "xytzc";

/* How a flat stack of frames maps to channels, z slices and time frames:
 * the first dimension listed after x and y varies fastest (OME). */
export type DimensionConfig = {
  dimensionOrder: DimensionOrder;
  channels: number;
  slices: number;
  frames: number;
};

export type UploadFile = {
  name: string;
  /* The file, or its bytes when the caller has read them already. */
  data: Blob | ArrayBuffer;
  /* Inferred from the name when absent. */
  mimeType?: string;
  /* Required for a multi-frame TIFF; ignored for other formats. */
  dimensionConfig?: DimensionConfig;
};

export type IngestFailure = { name: string; error: string };

export type IngestSummary = {
  /* Absent when cancelled before anything started, so no job exists. */
  jobId?: string;
  imageIds: string[];
  failed: IngestFailure[];
  cancelled: boolean;
};

export interface BackendIngest {
  /* Decodes and adds the files, one `ingest` job for the batch. Resolves
   * once every file is in (or has failed) and its images announced; the
   * caller's signal, or the job's cancel, stops it between files. */
  upload(files: UploadFile[], options?: CallOptions): Promise<IngestSummary>;
}

export interface BackendClassification {
  /* Listed models with a classification task. */
  listArchitectures(): Promise<ModelDescriptor[]>;
  list(): Promise<Classifier[]>;
  create(request: ClassifierCreateRequest): Promise<Classifier>;
  update(request: ClassifierUpdateRequest): Promise<Classifier>;
  delete(classifierId: string): Promise<void>;
  fit(
    request: ClassifierFitRequest,
    options?: CallOptions,
  ): Promise<ClassifierFitSummary>;
  predict(
    request: ClassifierPredictRequest,
    options?: CallOptions,
  ): Promise<ClassifierPredictSummary>;
  /* Against the validation set; also recorded on the latest run. */
  evaluate(classifierId: string): Promise<EvaluationResult>;
  /* Keeps the target's predicted categories and takes the items out of
   * the inference partition. */
  acceptPredictions(targetId: string): Promise<Changed>;
  /* Returns the target's predicted items to the unknown category. */
  clearPredictions(targetId: string): Promise<Changed>;
  export(classifierId: string): Promise<ClassifierExport>;
  import(request: ClassifierImportRequest): Promise<Classifier>;
  /* Only with the `classification.import-url` capability. */
  importFromUrl?(request: ClassifierUrlImportRequest): Promise<Classifier>;
}
