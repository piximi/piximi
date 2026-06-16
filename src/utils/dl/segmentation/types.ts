import type { AnnotationObject, Kind } from "store/dataV2/types";

import type { LoadCB } from "utils/types";

import type { Token } from "../cancel";
import type { ApiResult, InferenceInput, SerializedModelData } from "../types";
import type { ModelTask } from "../enums";

export type SegmenterModelArgs = {
  name: string;
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
  name: string;
  task: ModelTask;
  kind?: string | Array<string>;
  graph: boolean;
  pretrained: boolean;
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
  getModelInfo(name: string): Promise<ApiResult<SegmentaionModelDetails>>;
  hasModel(name: string): Promise<ApiResult<boolean>>;
  getAvailableSegmentationModels(): Promise<
    ApiResult<Record<string, SegmentaionModelDetails>>
  >;

  /*
   * Segmentation Ops
   */
  loadModel(modelName: string): Promise<ApiResult<void>>;
  predict(
    name: string,
    items: InferenceInput[],
    cancelToken: Token,
    loadCB?: LoadCB,
  ): Promise<ApiResult<SegmentationResults>>;

  // model I/O

  getSavedModelData(name: string): Promise<ApiResult<SerializedModelData>>;
  getZippedModelsBuffer(): Promise<ApiResult<ArrayBuffer>>;
  destroy(): Promise<ApiResult<void>>;
}
