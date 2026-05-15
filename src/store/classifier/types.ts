import type {
  ClassifierEvaluationResult,
  OptimizerSettings,
  PreprocessSettings,
} from "utils/dl/types";

export type RunTrigger = "fresh" | "continue" | "hitl-correction" | "import";

// Distinct from src/utils/modelsV2/enums.ts ModelStatus (which tracks runtime
// activity: Loading | Training | Idle | Pending). This tracks lifecycle/validity.
export type ModelLifecycleStatus =
  | "idle"
  | "training"
  | "waiting"
  | "loading"
  | "predicting"
  | "evaluating";

export type RunHyperparameterSnapshot = {
  architecture: 0 | 1 | string; // mirrors KindClassifier.modelNameOrArch
  optimizer: OptimizerSettings;
  preprocess: PreprocessSettings;
};

export type DatasetFingerprint = {
  trainingFingerprint: string;
  validationFingerprint: string;
};
export type RunStatus = "in-progress" | "completed" | "stopped" | "failed";
export type RunHistoryEpoch = {
  epoch: number;
  loss: number;
  valLoss: number;
  accuracy: number;
  valAccuracy: number;
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
  evalResults?: ClassifierEvaluationResult; // moved off ModelInfo
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
};

export enum ModelArch {
  SIMPLE_CNN = 0,
  MOBILE_NET = 1,
}
export type SoftmaxById = Record<string, number[]>;
export type KindClassifier = {
  modelTargetId: string;
  modelTargetName: string;
  activeModel: string | undefined;
  newModelArch: ModelArch;
  modelInfoDict: Record<string, ModelInfo>;
  status: ModelLifecycleStatus;
  activeSoftmaxById?: SoftmaxById;
};

export type KindClassifierDict = Record<string, KindClassifier>;
export type ClassifierState = {
  kindClassifiers: KindClassifierDict;
};
