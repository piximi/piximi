import type { ModelArch, RunHistoryEpoch } from "store/classifier/types";

import type { ModelTask } from "utils/dl/enums";
import type {
  ModelLayerData,
  OptimizerSettings,
  ReducedPreprocessSettings,
} from "utils/dl/types";

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
