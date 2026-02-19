import { ImageMetadata, ImageObject } from "store/data/types";
import { TensorReference } from "../tensorStorage/types";
import { DeserializeProjectOutput } from "workers/scheduler/types";

// ============================================================
// Pipeline Status & Progress
// ============================================================

export type PipelineStage =
  | "idle"
  | "loading"
  | "analyzing"
  | "deserializing"
  | "storing"
  | "complete"
  | "error"
  | "cancelled";

// ============================================================
// Project Deserialization Progress (granular sub-stages)
// ============================================================

export type ProjectDeserializationStage =
  | "unzipping"
  | "detecting-version"
  | "deserializing-project"
  | "converting"
  | "processing-images"
  | "processing-annotations";

export type ProjectDeserializationProgress = {
  stage: ProjectDeserializationStage;
  percent: number; // 0-100 overall
  processedCount?: number;
  totalCount?: number;
};

export type PipelineProgress = {
  stage: PipelineStage;
  stageProgress: number; // 0-100 for current stage
  overallProgress: number; // 0-100 for entire pipeline
  currentFile?: string;
  processedCount: number;
  totalCount: number;
  errors: PipelineError[];
  warnings: string[];
};

export type PipelineError = {
  fileName: string;
  error: Error;
  recoverable: boolean;
};

// ============================================================
// Upload Options
// ============================================================

export type UploadOptions = {
  // Time series configuration
  timeSeries?: boolean;
  timeSeriesDelimiter?: string;

  // Channel configuration (for ambiguous formats)
  channelConfig?: {
    interpretation: "rgb" | "greyscale" | "multichannel";
    channelCount?: number;
  };

  // Processing options
  skipPrepare?: boolean;
};

export type TiffImportConfig = {
  interpretAs: "timeSeries" | "zStack" | "channels" | "separate";
  frameRange?: { start: number; end: number };
};

// ============================================================
// Pipeline Results
// ============================================================

export type PipelineImageResult = {
  imageId: string;
  fileName: string;
  tensorRef: TensorReference;
};

export type PipelineResult = {
  success: boolean;
  images: PipelineImageResult[];
  metadataIds: string[];
  errors: PipelineError[];
  warnings: string[];
  stats: {
    totalFiles: number;
    successCount: number;
    failedCount: number;
    totalBytes: number;
    preparationTimeMs: number;
  };
};

export type ProjectPipelineResult = Omit<
  PipelineResult,
  "images" | "metadataIds"
> & {
  data: DeserializeProjectOutput | undefined;
};

// ============================================================
// Prepared Data (output from workers)
// ============================================================

export type PreparedImageData = {
  // Metadata for Redux
  metadata: Omit<ImageMetadata, "imageDataIds" | "defaultImageId"> & {
    imageDataIds: string[];
    defaultImageId: string;
  };

  // Image objects for Redux (without Tensor4D)
  images: Array<
    Omit<ImageObject, "data"> & {
      tensorRef: TensorReference;
    }
  >;

  // Raw data for IndexedDB (one per image)
  tensorData: Array<{
    id: string;
    buffer: ArrayBuffer;
    dtype: "float32" | "int32" | "uint8";
    shape: [number, number, number, number];
    preparedChannels: {
      data: number[][];
      histograms?: number[][];
    };
    renderedSrc: string;
  }>;
};

// ============================================================
// File Analysis Results
// ============================================================

export type FileAnalysisResult = {
  fileName: string;
  fileSize: number;
  mimeType: string;
  imageType: "standard" | "tiff" | "dicom";

  // For TIFF files
  tiffInfo?: {
    frameCount: number;
    isMultiFrame: boolean;
    suggestedType: "timeSeries" | "zStack" | "channels" | "unknown";
    confidence: number;
    metadata: Record<string, unknown>;
  };
};

// ============================================================
// Service Interface
// ============================================================

export interface IDataPipelineService {
  // Main entry points
  uploadFiles(
    files: FileList,
    options?: UploadOptions,
  ): Promise<PipelineResult>;
  openProject(files: File[]): Promise<ProjectPipelineResult>;
  loadExample(exampleId: string): Promise<ProjectPipelineResult>;

  // Analysis (for UI decisions)
  analyzeFiles(files: FileList): Promise<FileAnalysisResult[]>;

  // Progress and cancellation
  onProgress(callback: (progress: PipelineProgress) => void): () => void;
  cancel(): void;

  // State
  getStatus(): PipelineStage;
  getProgress(): PipelineProgress;
}

// ============================================================
// UI Dialog Integration
// ============================================================

/**
 * Callback for requesting user decisions during pipeline execution.
 * The pipeline pauses and waits for the callback to resolve
 */
export type TiffDialogCallback = (
  analysisResult: FileAnalysisResult,
) => Promise<TiffImportConfig | null>; //null = cancel

/**
 * Callback for requesting channel configuration from user.
 * Used when uploaded files have ambiguous channel counts
 */
export type ChannelConfigCallback = (
  fileInfo: FileAnalysisResult[],
) => Promise<number | null>; // null = cancel

/**
 * Extended upload options including dialog callbacks
 */
export type UploadOptionswithCallbacks = UploadOptions & {
  onTiffDialog?: TiffDialogCallback;
  onChannelConfig?: ChannelConfigCallback;
};
