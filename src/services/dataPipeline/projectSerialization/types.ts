import {
  AnnotationObject,
  Category,
  ImageMetadata,
  ImageObject,
  Kind,
} from "store/data/types";
import { ClassifierState, ProjectState, SegmenterState } from "store/types";
import { ExtractedModelFileMap } from "utils/models/types";
import { PipelineProgress } from "../types";

// ============================================================
// Shared raw buffer data (replaces Tensor4D + src)
// ============================================================

/**
 * Raw tensor data as an ArrayBuffer.
 * This replaces Tensor4D in all version types.
 * The buffer is in [Z, H, W, C] layout matching the original tensor shape.
 */
export type RawTensorData = {
  buffer: ArrayBuffer;
  dtype: "float32" | "int32" | "uint8";
  shape: [number, number, number, number]; // [Z, H, W, C]
};

/**
 * Raw data produced by deserialization.
 * Contains the tensor buffer, prepared channels, and rendered preview.
 * The caller decides how to store this data (e.g., IndexedDB).
 */
export type RawSerializedData = {
  id: string;
  buffer: ArrayBuffer;
  dtype: "float32" | "int32" | "uint8";
  shape: [number, number, number, number];
  preparedChannels: { data: number[][]; histograms?: number[][] };
  renderedSrc: string;
};

/**
 * Raw image data produced by deserialization.
 * Contains the tensor buffer, prepared channels, and rendered preview.
 * The caller decides how to store this data (e.g., IndexedDB).
 */
export type RawDeserializedImage = Omit<ImageObject, "src" | "data" | "shape"> &
  RawSerializedData;

/**
 * Raw annotation data produced by deserialization.
 */
export type RawDeserializedAnnotation = Omit<
  AnnotationObject,
  "src" | "data" | "shape"
> &
  RawSerializedData;

/**
 * Model file blobs extracted from the ZIP
 * These are transferred back to main thread for TF.js loading
 */
export type ExtractedModelFile = {
  fileName: string;
  blob: ArrayBuffer;
};

/*
NOTE:  The `TRef` generic parameter in the following types lets the caller 
       decide what reference type to use. In the worker, `TRef = TensorReference`. 
       In tests, `TRef` could be `string` or anything else. 
       The service doesn't know or care what the reference looks like.
*/

// ============================================================
// Callbacks — caller decides what to do with raw data
// ============================================================

/**
 * Called once per image during deserialization.
 * The caller should store the tensor data and return a reference.
 * Returning a value allows the service to include it in the final result.
 */
export type OnImageCallback<TRef> = (
  image: RawDeserializedImage,
) => Promise<TRef>;

/**
 * Called once per annotation during deserialization.
 */
export type OnAnnotationCallback<TRef> = (
  annotation: RawDeserializedAnnotation,
) => Promise<TRef>;

export type DeserializationCallbacks<TRef> = {
  onImage: OnImageCallback<TRef>;
  onAnnotation: OnAnnotationCallback<TRef>;
};

// ============================================================
// Deserialization result (metadata only — no tensor data)
// ============================================================

export type DeserializedImageMeta<TRef> = Omit<ImageObject, "src" | "data"> & {
  ref: TRef;
};

export type DeserializedAnnotationMeta<TRef> = Omit<
  AnnotationObject,
  "src" | "data"
> & {
  ref: TRef;
};

export type DeserializedProjectResult<TRef> = {
  project: ProjectState;
  classifier: ClassifierState;
  segmenter: SegmenterState;
  images: DeserializedImageMeta<TRef>[];
  annotations: DeserializedAnnotationMeta<TRef>[];
  categories: Array<Category>;
  kinds: Array<Kind>;
  metadata: Array<ImageMetadata>;
  modelFiles: ExtractedModelFileMap;
};

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
export interface IProjectSerializer {
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
  deserialize<TRef>(
    files: File[],
    callbacks: DeserializationCallbacks<TRef>,
    onProgress: (progress: number | Partial<PipelineProgress>) => void,
  ): Promise<DeserializedProjectResult<TRef>>;
}
