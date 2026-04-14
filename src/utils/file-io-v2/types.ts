import type { Stack as IJSStack } from "image-js-latest";
import type {
  Channel,
  ChannelMeta,
  ImageObject,
  ImageSeries,
  Plane,
  Shape,
} from "store/dataV2/types";
import { Progress } from "utils/types";
export type AnalyzeTiffOutput = {
  frameCount: number;
  isMultiFrame: boolean;
  OMEDims?: Partial<OMEDims>;
  metadata: Record<string, string | number | undefined | string[]>;
};

export const DimensionOrder = [
  "xyczt",
  "xyctz",
  "xyzct",
  "xyztc",
  "xytcz",
  "xytzc",
] as const;
export type OMEDims = {
  name: string | undefined;
  sizex: number;
  sizey: number;
  sizez: number;
  sizec: number;
  sizet: number;
  unit: string;
  pixeltype: string;
  dimensionorder: (typeof DimensionOrder)[number];
  pixelsizex: number;
  pixelsizey: number;
  pixelsizez: number;
  channelnames: string[];
};

/** Standardized input for all readers */
export type ReaderInput = {
  fileData: ArrayBuffer;
  fileName: string;
  mimeType: MimeType;
  /** Only provided for formats that need user-specified dimensions (TIFF) */
  dimConfig?: DimensionConfig;
};

/** Standardized output from all readers */
export type ReaderOutput = {
  stack: IJSStack;
  shape: Shape;
  dimConfig: DimensionConfig;
};

/** Every file reader implements this */
export interface IFileReader {
  readonly supportedTypes: readonly MimeType[];
  extract(input: ReaderInput): Promise<ReaderOutput>;
}
export const FILE = {
  BASIC: "basic",
  TIFF: "tiff",
  DICOM: "dicom",
  CZI: "czi",
} as const;
export const MIME = {
  PNG: "image/png",
  JPEG: "image/jpeg",
  TIFF: "image/tiff",
  DICOM: "application/dicom",
  BMP: "image/bmp",
  CZI: "image/czi",
  UNKNOWN: "application/octet-stream",
} as const;
export type MimeType = (typeof MIME)[keyof typeof MIME];
export type FileType = (typeof FILE)[keyof typeof FILE];
// ============================================================
// Upload Status & Progress
// ============================================================

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

type TotalStage = "analyze" | "load" | "store" | "finalize";
export type ReadStage = "extract" | "toDims" | "toExperiment";
export type StageName = TotalStage | ReadStage;
// ============================================================
// Upload Options
// ============================================================

type UploadOptions = {
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

export type DimensionConfig = {
  dimensionOrder: (typeof DimensionOrder)[number];
  channels: number;
  slices: number;
  frames: number;
};
export type TiffImportConfig = DimensionConfig & {
  frameRange?: { start: number; end: number };
  OMEDims?: OMEDims;
};

// ============================================================
// Upload Results
// ============================================================

type FileResult = {
  fileName: string;
  imageSeries: ImageSeriesResult[];
  images: ImageObject[];
  planes: Plane[];
  channels: Channel[];
  channelMetas: ChannelMeta[];
};

export type ReaderResult =
  | {
      success: false;
      cancelled: boolean;
    }
  | {
      success: true;
      data: {
        imageSeries: ImageSeriesResult[];
        channelMetas: ChannelMeta[];
        images: ImageObject[];
        planes: Plane[];
        channelData: ChannelResult[];
      };
    };

export type FileUploadResult =
  | {
      success: boolean;
      cancelled: boolean;
      data: FileResult[];
    }
  | { success: false; cancelled: true };

// ============================================================
// File Interperetation Results
// ============================================================

type FileDetails = {
  fileName: string;
  fileSize: number;
  mimeType: MimeType;
  imageType: FileType;
};
export type FileInterpretationResult = {
  imageType: FileType;
  fileResults: Record<string, FileDetails>;
};

// ============================================================
// File Analysis Results
// ============================================================

export type TiffAnalysisResult = AnalyzeTiffOutput & {
  fileName: string;
};
// ============================================================
// File Analysis Results
// ============================================================

export type FileAnalysisResult = FileDetails & {
  // For TIFF files
  tiffInfo?: AnalyzeTiffOutput;
};

// ============================================================
// Service Interface
// ============================================================

export interface IFileUploadService {
  // Main entry points
  uploadFiles(
    files: FileList,
    options?: UploadOptions,
  ): Promise<FileUploadResult>;
  // Analysis (for UI decisions)
  analyzeTiffs(files: FileList): Promise<{
    analyses: TiffAnalysisResult[];
    buffers: Map<string, ArrayBuffer>;
  }>;

  // Progress and cancellation
  onProgress(callback: (progress: Progress) => void): () => void;
  storeAndAttach(
    channelData: ChannelResult[],
  ): Promise<
    { success: false; error: Error } | { success: true; channels: Channel[] }
  >;
  cancel(): void;

  // State
  getStatus(): UploadStage;
  getProgress(): Progress;
}

// ============================================================
// UI Dialog Integration
// ============================================================

export type TiffDialogCallbackResult = Record<string, TiffImportConfig>;
/**
 * Callback for requesting user decisions during pipeline execution.
 * The pipeline pauses and waits for the callback to resolve
 */
type TiffDialogCallback = (
  analysisResults: TiffAnalysisResult[],
) => Promise<TiffDialogCallbackResult | null>; //null = cancel

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
/**
 * Input for combined load + prepare operation
 */
export type ImportImageInput = {
  fileData: ArrayBuffer;
  fileName: string;
  mimeType: MimeType;
  dimConfig?: DimensionConfig;
};

/**
 * Output from load + prepare (ready for storage)
 */

export type ImageSeriesResult = Omit<ImageSeries, "experimentId">;
export type ImageResult = ImageObject;
export type ChannelResult = Omit<Channel, "storageReference"> & {
  data: ArrayBuffer;
  histogram: ArrayBuffer;
};
export type LoadAndPrepareOutput = {
  imageSeries: ImageSeriesResult[];
  images: ImageResult[];
  planes: Plane[];
  channels: ChannelResult[];
  channelMetas: ChannelMeta[];
};
