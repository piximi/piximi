import { ImageMetadata, ImageObject, AnnotationObject } from "store/data/types";
import { TensorReference } from "../tensorStorage/types";

// ============================================================
// Pipeline Status & Progress
// ============================================================

export type PipelineStage =
  | "idle"
  | "loading"
  | "analysing"
  | "preparing"
  | "storing"
  | "complete"
  | "error"
  | "cancelled";

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
  timeSeriesDelimeter?: string;

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

export type PipelineResult = {
  success: boolean;
  metadataIds: string[];
  imageIds: string[];
  tensorRefs: TensorReference[];
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
  openProject(file: File): Promise<PipelineResult>;
  loadExample(exampleId: string): Promise<PipelineResult>;

  // Analysis (for UI decisions)
  analyzeFiles(files: FileList): Promise<FileAnalysisResult[]>;

  // Progress and cancellation
  onProgress(callback: (progress: PipelineProgress) => void): () => void;
  cancel(): void;

  // State
  getStatus(): PipelineStage;
  getProgress(): PipelineProgress;
}
