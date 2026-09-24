import type { AnnotationObject } from "core/entities";

import type { LoadCB } from "utils/types";

import type { Token } from "../cancel";
import type { ApiResult, InferenceInput, SerializedModelData } from "../types";

export const MODELS = [
  "Cellpose-SAM",
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
  // True only when `loadModel` actually stops on abort. Drives whether the
  // load task is offered as cancellable; see `ModelArgs.cancellableLoad`.
  cancellableLoad: boolean;
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
  loadModel(modelName: ModelName, loadCB?: LoadCB): Promise<ApiResult<void>>;
  /*
   * Aborts an in-flight `loadModel`. An `AbortSignal` is not structured-
   * cloneable, so it cannot be handed to the worker; the controller lives
   * worker-side instead and this call trips it over Comlink.
   */
  cancelLoadModel(modelName: ModelName): Promise<ApiResult<void>>;
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
