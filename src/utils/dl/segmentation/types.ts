import type { AnnotationObject, Kind } from "store/dataV2/types";

import type { LoadCB } from "utils/types";

import type { Token } from "../cancel";
import type { ApiResult, InferenceInput, SerializedModelData } from "../types";
import type { ModelTask } from "../enums";

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
export type SegmenterModelArgs = {
  name: ModelName;
  task: ModelTask;
  graph: boolean;
  pretrained: boolean;
  trainable: boolean;
  kinds: Array<string>;
  src?: string;
  requiredChannels?: number;
};
export type SegmentationState = "idle" | "loading" | "predicting";

export type SegmentaionModelDetails = {
  name: ModelName;
  displayName: string;
  kind?: string | Array<string>;
  modelLoaded: boolean;
  defaultInputShape: number[] | undefined;
  defaultOutputShape: number[] | undefined;
  requiredChannels?: number;
};
export type BatchModelLoadResult = {
  loadedModels: SegmentaionModelDetails[];
  failedModels: Record<string, { reason: string; err?: Error }>;
};
export type LoadInferenceDataArgs = {
  // if cat undefined, created from default classes
  kinds?: Array<Kind>;
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
