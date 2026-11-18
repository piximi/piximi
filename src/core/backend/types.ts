import type {
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
} from "core/entities";
import type {
  ModelDisplayInfo,
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
  readonly segmentation?: BackendSegmentation;
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
// went as `images/didRemove` / `annotations/didRemove`.

export type Deleted = { deleted: number };

export interface BackendImages {
  /* Each image with its planes, channels and objects. */
  delete(query: ImageQuery): Promise<Deleted>;
}

export interface BackendAnnotations {
  /* Each annotation, and any volume left without one. */
  delete(query: AnnotationQuery): Promise<Deleted>;
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

export type SegmentationModelDescriptor = SegmentationModelDetails &
  Omit<ModelDisplayInfo, "name" | "displayName"> & {
    status: ModelStatus;
    /* Why it is `unavailable` or `failed`, or what a build is doing. */
    statusMessage?: string;
    /* What runs the model, e.g. "cellcast", "pytorch", "tensorflow.js". */
    framework: string;
    version?: string;
    tasks: ModelTask[];
    resources?: ModelResources;
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
