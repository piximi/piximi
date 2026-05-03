import type {
  AnnotationObject,
  AnnotationVolume,
  Category,
  Channel,
  ChannelMeta,
  Experiment,
  ImageObject,
  ImageSeries,
  Kind,
  Plane,
} from "store/dataV2/types";
import type { ClassifierState } from "store/classifier/types";
import type { SegmenterState } from "store/segmenter/types";

import type { ExtractedModelFileMap } from "utils/dl/types";
import type { Progress } from "utils/types";

import type { ProjectState } from "@ProjectViewer/state/types";
import type { V2PiximiState } from "./version-readers/version-types/v2Types";

export type UploadStage =
  | "idle"
  | "loading"
  | "analyzing"
  | "deserializing"
  | "serializing"
  | "storing"
  | "complete"
  | "error"
  | "cancelled";
/**
 * Raw tensor data as an ArrayBuffer.
 * This replaces Tensor4D in all version types.
 * The buffer is in [Z, H, W, C] layout matching the original tensor shape.
 */
export type RawData = {
  buffer: ArrayBuffer;
  dtype: "float32" | "int32" | "uint8";
  shape: [number, number, number, number]; // [Z, H, W, C]
};

export type LoadProjectInput = {
  files: File[];
};
export type LoadProjectOutput = {
  project: V2PiximiState;
  modelFiles: ExtractedModelFileMap;
};

/**
 * Model file blobs extracted from the ZIP
 * These are transferred back to main thread for TF.js loading
 */
export type ExtractedModelFile = {
  fileName: string;
  blob: ArrayBuffer;
};

export type DeserializedProject = {
  project: ProjectState;
  classifier: ClassifierState;
  segmenter: SegmenterState;
  data: {
    experiment: Experiment;
    imageSeries: ImageSeries[];
    images: ImageObject[];
    channelMetas: ChannelMeta[];
    kinds: Kind[];
    categories: Category[];
    annotationVolumes: AnnotationVolume[];
    planes: Plane[];
    channels: Channel[];
    annotations: AnnotationObject[];
  };
};
export type DeserializedProjectResult =
  | {
      success: true;
      project: DeserializedProject;
    }
  | { success: false; cancelled: true }
  | { success: false; cancelled: false; error: Error };

// ============================================================
// Service Interface
// ============================================================

/**
 * Public contract for the project serialization service.
 *
 * Reads Piximi's Zarr-based project format (`.piximi` / `.zarr`) from one
 * or more files and returns fully-converted project state.
 *
 * The service is stateless with respect to storage — raw tensor data is
 * handed off via {@link DeserializationCallbacks} so the caller controls
 * where it ends up (IndexedDB, memory, etc.).
 *
 * @typeParam TRef - The reference type returned by storage callbacks.
 *                   In production this is typically `TensorReference`;
 *                   in tests it can be any convenient stand-in.
 */
export interface IProjectLoader {
  /**
   * Deserialize a Piximi project from one or more files.
   *
   * Accepts either:
   * - A single `.piximi` / `.zip` file containing a `.zarr` directory, or
   * - A list of files representing an unzipped `.zarr` directory
   *   (selected via `webkitdirectory` input).
   *
   * The pipeline:
   * 1. Opens a Zarr store from the input files.
   * 2. Detects the project format version (0.1 → 1.2+).
   * 3. Reads version-specific data and migrates it to the latest format.
   * 4. Processes each image/annotation tensor (prepares channels, renders
   *    preview) and invokes the corresponding callback.
   * 5. Returns structured project state ready for Redux dispatch.
   *
   * @param files      - One or more `File` objects to deserialize.
   * @param callbacks  - Per-item callbacks for storing tensor data.
   *                     Called once per image and once per annotation.
   * @param onProgress - Progress reporter called with values in `[0, 100]`.
   *                     Called at each major pipeline stage.
   * @returns Fully deserialized project state including metadata, categories,
   *          kinds, classifier/segmenter config, and storage references.
   */
  uploadProject(
    files: File[],
    onProgress: (progress: number | Partial<Progress>) => void,
  ): Promise<DeserializedProjectResult>;
}
