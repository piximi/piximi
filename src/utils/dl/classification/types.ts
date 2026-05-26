import type { Kind, Shape } from "store/dataV2/types";

import type {
  CropSchema,
  LossFunction,
  Metric,
  ModelTask,
  OptimizationAlgorithm,
} from "utils/dl/enums";
import type {
  CropOptions,
  InferenceInput,
  NormalizeOptions,
  SerializedModelData,
  TrainingInput,
} from "utils/dl/types";

import type { Logs } from "@tensorflow/tfjs";

/*
 * Model Definition
 */
export enum ModelArch {
  SIMPLE_CNN = 0,
  MOBILE_NET = 1,
}
export type RunStatus = "in-progress" | "completed" | "stopped" | "failed";
export interface ModelLayerData {
  layerName: string;
  outputShape: string;
  parameters: number;
  trainable: string;
}
export type ModelArgs = {
  name: string;
  task: ModelTask;
  graph: boolean;
  pretrained: boolean;
  trainable: boolean;
  kind?: string;
  src?: string;
  requiredChannels?: number;
};
export type PreprocessSettings = {
  shuffle: boolean;
  inputShape: Shape;
  normalizeOptions: NormalizeOptions;
  cropOptions: CropOptions;
  trainingPercentage: number;
};

export type ReducedPreprocessSettings = {
  cropSchema: CropSchema;
  numCrops: number;
  inputShape: Omit<Shape, "planes">;
  shuffle: boolean;
  normalize: boolean;
  batchSize: number;
};
export type OptimizerSettings = {
  learningRate: number;
  lossFunction:
    | LossFunction
    | Array<LossFunction>
    | { [outputName: string]: LossFunction };
  metrics: Array<Metric>;
  optimizationAlgorithm: OptimizationAlgorithm;
  epochs: number;
  batchSize: number;
};
export type ClassifierModelParams = {
  preprocessSettings: PreprocessSettings;
  optimizerSettings: OptimizerSettings;
};
export type FitOptions = Pick<OptimizerSettings, "epochs" | "batchSize">;

export type RunHistoryEpoch = {
  epoch: number;
  loss: number;
  valLoss: number;
  accuracy: number;
  valAccuracy: number;
};

export type DatasetFingerprint = {
  trainingFingerprint: string;
  validationFingerprint: string;
};
export type RunTrigger = "fresh" | "continue" | "hitl-correction" | "import";

// Distinct from src/utils/modelsV2/enums.ts ModelStatus (which tracks runtime
// activity: Loading | Training | Idle | Pending). This tracks lifecycle/validity.
export type ModelLifecycleStatus =
  | "idle"
  | "loading"
  | "training"
  | "waiting"
  | "predicting"
  | "evaluating";

export type RunHyperparameterSnapshot = {
  architecture: 0 | 1 | string; // mirrors KindClassifier.modelNameOrArch
  optimizer: OptimizerSettings;
  preprocess: PreprocessSettings;
};

export type Run = {
  id: string;
  parentRunId?: string;
  startedAt: string;
  finishedAt?: string;
  status: RunStatus;
  trigger: RunTrigger;
  seed?: number; // Determine how useful this is. seeds are only used during model creation afaik
  appVersion: string;
  tfjsVersion: string;
  backend: string;
  hyperparameters: RunHyperparameterSnapshot;
  classMap: ModelClassMap;
  trainingFingerprint: string; // equality comparison between runs
  validationFingerprint: string; // ^^^
  valIds: string[]; // for set operations, snapshot UI, partial overlap analytics between models
  categorySetHash: string;
  history: RunHistoryEpoch[];
  evalResults?: EvaluationResult; // moved off ModelInfo
  weightsRef?: string; // model name in classifierHandler, currently no real use but reference snapshotted weights in the future
};
export type ModelClassMap = Record<number, string>;
export type ModelInfo = {
  classMap?: ModelClassMap;
  preprocessSettings: PreprocessSettings;
  optimizerSettings: OptimizerSettings;
  confidenceThreshold: number;
  runs: Run[];
  valid: boolean;
  initSeed?: number;
  trained?: boolean;
};
/*
 * Interface
 */
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

export type ModelInfoDTO = {
  name: string;
  archTag: ModelArch | string | undefined;
  task: ModelTask;
  graph: boolean;
  trainable: boolean;
  pretrained: boolean;
  classes: string[];
  numClasses: number;
  preprocessingSettings: ReducedPreprocessSettings | undefined;
  optimizerSettings: OptimizerSettings | undefined;
  currentFitHistory: RunHistoryEpoch[];
  modelSummary: ModelLayerData[] | undefined;
  modelLoaded: boolean;
  trainingLoaded: boolean;
  validationLoaded: boolean;
  inferenceLoaded: boolean;
  defaultInputShape: number[] | undefined;
  defaultOutputShape: number[] | undefined;
  requiredChannels?: number;
};

export type TrainingResults = {
  weightsRef: string;
  status: RunStatus;
};
export type EvaluationResult = {
  confusionMatrix: number[][];
  accuracy: number;
  crossEntropy: number;
  precision: number;
  recall: number;
  f1Score: number;
};

export type PredictionResult = {
  categoryId: string;
  maxProb: number;
  softmax: number[];
}[];

export type TrainAndEvalResult = TrainingResults & {
  evalResults: EvaluationResult;
};

export type LoadModelArgs = {
  inputShape: Shape;
  numClasses: number;
  compileOptions: OptimizerSettings;
  preprocessOptions: PreprocessSettings;
  freeze?: boolean;
  useCustomTopLayer?: boolean;
  randomizeWeights?: boolean;
};

export type LoadInferenceDataArgs = {
  fitOptions: FitOptions;
  // if cat undefined, created from default classes
  // if defined, it should be length 1, as only a foreground class is needed
  kinds?: Array<Kind>;
};

export type TrainingCallbacks = {
  onEpochEnd: (epoch: number, logs?: Logs) => Promise<void>;
};

export type ModelLoadResult =
  | { success: true; modelInfo: ModelInfoDTO }
  | {
      success: false;
      modelName: string;
      error: { reason: string; err?: Error };
    };

export type BatchModelLoadResult = {
  loadedModels: ModelInfoDTO[];
  failedModels: Record<string, { reason: string; err?: Error }>;
};

export interface IClassifierApi {
  // registry reads
  getModelNames(): Promise<ApiResult<string[]>>;
  getModelInfo(name: string): Promise<ApiResult<ModelInfoDTO>>;
  hasModel(name: string): Promise<ApiResult<boolean>>;

  // lifecycle
  createNewModel(
    name: string,
    arch: ModelArch,
    seed: number,
  ): Promise<ApiResult<ModelInfoDTO>>;
  removeModel(name: string): Promise<ApiResult<string>>;
  removeAllModels(): Promise<ApiResult<void>>;

  // data loading — return the model name so callers can chain / log
  loadTraining(
    name: string,
    items: TrainingInput[],
    cats: { id: string }[],
    seed: number,
  ): Promise<ApiResult<string>>;
  loadValidation(
    name: string,
    items: TrainingInput[],
    cats: { id: string }[],
    seed: number,
  ): Promise<ApiResult<string>>;
  loadInference(
    name: string,
    items: InferenceInput[],
    cats: { id: string }[],
  ): Promise<ApiResult<string>>;
  loadData(
    name: string,
    tr: TrainingInput[],
    va: TrainingInput[],
    cats: { id: string }[],
    seed: number,
  ): Promise<ApiResult<string>>;
  prepareModel(
    name: string,
    tr: TrainingInput[],
    va: TrainingInput[],
    n: number,
    cats: { id: string }[],
    pp: PreprocessSettings,
    opt: OptimizerSettings,
    seed: number,
  ): Promise<ApiResult<void>>;
  recompile(
    modelName: string,
    optimizerSettings: OptimizerSettings,
  ): Promise<ApiResult<string>>;

  // training
  train(
    name: string,
    options: FitOptions,
    callbacks: TrainingCallbacks,
  ): Promise<ApiResult<TrainAndEvalResult>>;
  cancelTraining(name: string): Promise<ApiResult<string>>;

  // inference / eval
  predict(
    name: string,
    cats: { id: string }[],
  ): Promise<ApiResult<PredictionResult>>;
  evaluate(name: string): Promise<ApiResult<EvaluationResult>>;

  // model I/O
  modelFromFiles(input: {
    descFile: File;
    weightsFiles: File[];
    isGraph?: boolean;
    modelName?: string;
  }): Promise<ApiResult<ModelInfoDTO>>;
  modelFromUrl(
    url: string,
    fromTFHub: boolean,
    isGraph: boolean,
  ): Promise<ApiResult<BatchModelLoadResult>>;
  modelsFromZipBuffer(
    buffer: ArrayBuffer,
  ): Promise<ApiResult<BatchModelLoadResult>>;
  getSavedModelData(name: string): Promise<ApiResult<SerializedModelData>>;
  getZippedModelsBuffer(): Promise<ApiResult<ArrayBuffer>>;
}
