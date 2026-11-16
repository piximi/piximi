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
  Kind,
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
  readonly segmentation?: BackendSegmentation;
}

export type BackendKind = "local" | "remote";

export type BackendSession = { id: string; protocolVersion: string };

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

export type PageRequest = { cursor?: string; limit: number };

export type Page<T> = { items: T[]; total: number; nextCursor?: string };

export type ImageQuery = { ids?: string[] };

export type ImageRecord = {
  image: ImageObject;
  planes: Plane[];
  channels: Channel[];
};

export type AnnotationQuery = { imageIds?: string[] };

/* Masks are fetched separately (`masks`); they dominate the payload size. */
export type AnnotationRecord = {
  volume: AnnotationVolume;
  annotation: Omit<AnnotationObject, "encodedMask" | "decodedMask">;
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
  images(query: ImageQuery, page: PageRequest): Promise<Page<ImageRecord>>;
  annotations(
    query: AnnotationQuery,
    page: PageRequest,
  ): Promise<Page<AnnotationRecord>>;
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

// ── Jobs ─────────────────────────────────────────────────────────────────────

export interface BackendJobs {
  list(): Promise<Job[]>;
  cancel(id: string): Promise<void>;
}

// ── Segmentation ─────────────────────────────────────────────────────────────

export type SegmentationModelDescriptor = SegmentationModelDetails &
  Omit<ModelDisplayInfo, "name" | "displayName">;

export type SegmentationRunRequest = {
  modelId: string;
  imageIds: string[];
  /* The channel metas to feed the model, in model-input order. */
  channelMetaIds: string[];
  options?: SegmenterOptionValues;
  kindName?: string;
};

export type SegmentationRunSummary = {
  jobId: string;
  added: number;
  skipped: number;
  cancelled: boolean;
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
