import {
  ClassifierEvaluationResultType,
  OptimizerSettings,
  PreprocessSettings,
} from "utils/dl/types";

export type RunTrigger = "fresh" | "continue" | "hitl-correction" | "import";

// Distinct from src/utils/modelsV2/enums.ts ModelStatus (which tracks runtime
// activity: Loading | Training | Idle | Pending). This tracks lifecycle/validity.
export type ModelLifecycleStatus = "idle" | "training" | "stale" | "invalid";

export type RunHyperparameterSnapshot = {
  architecture: 0 | 1 | string; // mirrors KindClassifier.modelNameOrArch
  optimizer: OptimizerSettings;
  preprocess: PreprocessSettings;
};

export type DatasetFingerprint = {
  trainIds: string;
  valIds: string;
  count: number;
};
export type CategoryDelta = { added: string[]; removed: string[] };
export type RunStatus = "completed" | "stopped" | "failed";
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
  finishedAt: string;
  status: RunStatus;
  trigger: RunTrigger;
  seed: number;
  appVersion: string;
  tfjsVersion: string;
  backend: string;
  hyperparameters: RunHyperparameterSnapshot;
  classMap: ModelClassMap;
  datasetFingerprint: DatasetFingerprint;
  categorySetHash: string;
  categoryDelta?: CategoryDelta;
  history: RunHistoryEpoch[];
  evalResults: ClassifierEvaluationResultType; // moved off ModelInfo
  weightsRef: string; // model name in classifierHandler
};
export type ModelClassMap = Record<number, string>;
export type ModelInfo = {
  classMap?: ModelClassMap;
  preprocessSettings: PreprocessSettings;
  optimizerSettings: OptimizerSettings;
  status: ModelLifecycleStatus;
  confidenceThreshold: number;
  runs: Run[];
};
export type KindClassifier = {
  modelNameOrArch: string | number;
  modelInfoDict: Record<string, ModelInfo>;
};

export type KindClassifierDict = Record<string, KindClassifier>;
export type ClassifierState = {
  kindClassifiers: KindClassifierDict;
  showClearPredictionsWarning: boolean;
};
