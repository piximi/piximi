import type { AnnotationObject } from "store/data/types";

import type { LoadCB } from "utils/types";

import type { Token } from "../cancel";
import type { ApiResult, InferenceInput, SerializedModelData } from "../types";

export const MODELS = [
  "Cellpose",
  "StardistVHE",
  "StardistFluo",
  "GlandSegmentation",
  "COCO-SSD",
] as const;

export type ModelName = (typeof MODELS)[number];

export type ModelDisplayInfo = {
  name: ModelName;
  displayName: string;
  description: string;
  use: string;
  output: { name: string; url?: string };
  sources: Array<{ text: string; url: string }>;
  cite?: Array<{ text: string; url: string }>;
  cloudWarning?: string;
};

export type SegmentationState = "idle" | "loading" | "predicting";

export type SegmentaionModelDetails = {
  name: ModelName;
  displayName: string;
  kind?: string | Array<string>;
  modelLoaded: boolean;
  requiredChannels: number;
};

export type PredictedAnnotationObject = Omit<
  AnnotationObject,
  "imageId" | "planeId" | "shape" | "volumeId"
> & { kindName: string };
export type SegmentationResults = {
  cancelled?: boolean;
  annotations: Array<Array<PredictedAnnotationObject>>;
};
export interface ISegmenterApi {
  // registry reads
  getModelNames(): Promise<ApiResult<string[]>>;
  getModelInfo(name: ModelName): Promise<ApiResult<SegmentaionModelDetails>>;
  hasModel(name: ModelName): Promise<ApiResult<boolean>>;
  getAvailableSegmentationModels(): Promise<
    ApiResult<Record<string, SegmentaionModelDetails>>
  >;

  /*
   * Segmentation Ops
   */
  loadModel(modelName: ModelName): Promise<ApiResult<void>>;
  predict(
    name: ModelName,
    items: InferenceInput[],
    cancelToken: Token,
    loadCB?: LoadCB,
  ): Promise<ApiResult<SegmentationResults>>;

  // model I/O

  getSavedModelData(name: ModelName): Promise<ApiResult<SerializedModelData>>;
  getZippedModelsBuffer(): Promise<ApiResult<ArrayBuffer>>;
  destroy(): Promise<ApiResult<void>>;
}
