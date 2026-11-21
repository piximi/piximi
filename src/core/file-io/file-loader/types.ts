import type { Stack as IJSStack } from "image-js-latest";

import type { Token } from "core/dl/cancel";
import type {
  Channel,
  ChannelMeta,
  ImageObject,
  ImageSeries,
  Plane,
  Shape,
} from "core/entities";

export type AnalyzeTiffOutput = {
  frameCount: number;
  isMultiFrame: boolean;
  OMEDims?: Partial<OMEDims>;
  metadata: Record<string, string | number | undefined | string[]>;
};

export const DIMENSION_ORDERS = [
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
  dimensionorder: DimensionOrder;
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
export const MIME = {
  PNG: "image/png",
  JPEG: "image/jpeg",
  TIFF: "image/tiff",
  DICOM: "application/dicom",
  BMP: "image/bmp",
  CZI: "image/czi",
  HEIC: "image/heic",
  UNKNOWN: "application/octet-stream",
} as const;
export type MimeType = (typeof MIME)[keyof typeof MIME];
type TotalStage = "analyze" | "load" | "store" | "finalize";
export type ReadStage = "extract" | "toDims" | "toExperiment";
export type StageName = TotalStage | ReadStage;
export type DimensionOrder = (typeof DIMENSION_ORDERS)[number];
export type DimensionConfig = {
  dimensionOrder: DimensionOrder;
  channels: number;
  slices: number;
  frames: number;
};
export type TiffImportConfig = DimensionConfig & {
  frameRange?: { start: number; end: number };
  OMEDims?: OMEDims;
};

// ============================================================
// File Analysis Results
// ============================================================

export type TiffAnalysisResult = AnalyzeTiffOutput & {
  fileName: string;
};
export type TiffPrepResult = {
  configs: Map<string, TiffImportConfig>;
  buffers: Map<string, ArrayBuffer>;
};
// ============================================================
// UI Dialog Integration
// ============================================================

export type TiffDialogCallbackResult = Record<string, TiffImportConfig>;
/**
 * Callback for requesting user decisions during pipeline execution.
 * The pipeline pauses and waits for the callback to resolve
 */
export type TiffDialogCallback = (
  analysisResults: TiffAnalysisResult[],
) => Promise<TiffDialogCallbackResult | null>; //null = cancel

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
/* What the decoding worker exposes through Comlink. */
export type LoadImageWorkerAPI = {
  loadImage: (
    input: ImportImageInput,
    cancelToken: Token,
    onProgress: (progress: { value: number; stage: ReadStage }) => void,
    requiredChannels?: number,
  ) => Promise<LoadAndPrepareOutput>;
};

export type LoadAndPrepareOutput = {
  imageSeries: ImageSeriesResult[];
  images: ImageResult[];
  planes: Plane[];
  channels: ChannelResult[];
  channelMetas: ChannelMeta[];
};
