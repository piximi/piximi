import type { AnnotationObject, Kind } from "store/dataV2/types";

import type { ApiResult, InferenceInput, SerializedModelData } from "../types";
import type { ModelTask } from "../enums";

export type ModelInfoDTO = {
  name: string;

  task: ModelTask;
  graph: boolean;

  pretrained: boolean;

  modelLoaded: boolean;

  inferenceLoaded: boolean;
  defaultInputShape: number[] | undefined;
  defaultOutputShape: number[] | undefined;
  requiredChannels?: number;
};
export type BatchModelLoadResult = {
  loadedModels: ModelInfoDTO[];
  failedModels: Record<string, { reason: string; err?: Error }>;
};
export type LoadInferenceDataArgs = {
  // if cat undefined, created from default classes
  kinds?: Array<Kind>;
};
export type PredictedAnnotationObject = Omit<
  AnnotationObject,
  "imageId" | "planeId" | "shape" | "volumeId"
> & { kindId: string };
export type SegmentationResults = Array<Array<PredictedAnnotationObject>>;
export interface ISegmenterApi {
  // registry reads
  getModelNames(): Promise<ApiResult<string[]>>;
  getModelInfo(name: string): Promise<ApiResult<ModelInfoDTO>>;
  hasModel(name: string): Promise<ApiResult<boolean>>;

  // data loading — return the model name so callers can chain / log

  loadInference(
    name: string,
    items: InferenceInput[],
    cats: { id: string }[],
  ): Promise<ApiResult<string>>;

  // inference
  predict(name: string): Promise<ApiResult<SegmentationResults>>;

  // model I/O

  getSavedModelData(name: string): Promise<ApiResult<SerializedModelData>>;
  getZippedModelsBuffer(): Promise<ApiResult<ArrayBuffer>>;
  destroy(): Promise<ApiResult<void>>;
}
