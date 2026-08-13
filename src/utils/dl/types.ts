import type { Shape, BBox, ExtendedChannel } from "store/data/types";

import type {
  CropSchema,
  LossFunction,
  Metric,
  OptimizationAlgorithm,
  Partition,
} from "./enums";

export type TrainingInput = {
  id: string;
  partition: Partition;
  categoryId: string;
  channelsRef: ExtendedChannel[];
  shape: Shape;
  region: BBox;
};

export type InferenceInput = Omit<TrainingInput, "partition" | "categoryId">;

export type NormalizeOptions = {
  normalize: boolean;
  center: boolean;
};

export type CropOptions = {
  numCrops: number;
  cropSchema: CropSchema;
};

export type SegmenterPreprocessSettings = {
  shuffle: boolean;
  normalizeOptions: NormalizeOptions;
  cropOptions: CropOptions;
};

export type SegmenterCompileSettings = {
  learningRate: number;
  lossFunction:
    | LossFunction
    | Array<LossFunction>
    | { [outputName: string]: LossFunction };
  metrics: Array<Metric>;
  optimizationAlgorithm: OptimizationAlgorithm;
};

export type SegmenterEvaluationResultType = {
  pixelAccuracy: number;
  IoUScore: number;
  diceScore: number;
};

export type ExtractedModelFile = {
  modelJson?: File;
  modelWeights?: File;
};

export type ExtractedModelFileMap = Record<string, ExtractedModelFile>;

export type SerializedModelData = {
  modelJson: { blob: Blob; fileName: string };
  modelWeights: { blob: Blob; fileName: string };
};
export type SerializedModels = Record<string, SerializedModelData>;
export type ErrorCode =
  | "MODEL_NOT_FOUND"
  | "MODEL_CREATE_FAILED"
  | "TF_LOAD_FAILED"
  | "PREPROCESS_FAILED"
  | "TRAINING_FAILED"
  | "PREDICTION_FAILED"
  | "EVALUATION_FAILED"
  | "UPLOAD_FAILED"
  | "MISSING_FILE"
  | "INVALID_FILE_FORMAT"
  | "UNKNOWN";

export type ErrorReason = {
  code: ErrorCode;
  message: string;
  cause?: unknown;
};

export type ApiResult<T = void> = [T] extends [void]
  ? { success: true } | { success: false; reason: ErrorReason }
  : { success: true; data: T } | { success: false; reason: ErrorReason };
