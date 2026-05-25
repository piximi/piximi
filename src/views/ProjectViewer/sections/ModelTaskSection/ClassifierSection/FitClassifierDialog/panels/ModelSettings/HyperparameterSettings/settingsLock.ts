import type {
  OptimizerSettings,
  PreprocessSettings,
} from "utils/dl/classification/types";
import type { OptimizationAlgorithm } from "utils/dl/enums";

export type SettingsType = "architecture" | "integrity" | "tunable";

type TrainingSetting = keyof PreprocessSettings | keyof OptimizerSettings;
const settingTierLookup: Record<TrainingSetting, SettingsType> = {
  inputShape: "architecture",
  lossFunction: "integrity",
  metrics: "integrity",
  batchSize: "integrity",
  shuffle: "integrity",
  normalizeOptions: "integrity",
  cropOptions: "integrity",
  trainingPercentage: "integrity",
  learningRate: "tunable",
  optimizationAlgorithm: "tunable",
  epochs: "tunable",
};

export const isFieldLocked = (
  setting: TrainingSetting,
  isTraining: boolean,
  pretrained: boolean,
): boolean => {
  const tier = settingTierLookup[setting];
  if (isTraining) return true; // anything in flight is locked
  if (tier === "architecture" || tier === "integrity") return pretrained;
  return false; // tunable fields editable across runs
};

export const lockReason = (setting: TrainingSetting, isTraining: boolean) => {
  const tier = settingTierLookup[setting];
  if (isTraining)
    return "Wait for training to complete before editing parameters"; // anything in flight is locked
  if (tier === "architecture")
    return "Architecture settings can not be changed from initial values";
  if (tier === "integrity")
    return "Changing this value will invalidate the run-over-run comparibility of the model";
};

export const diffCompileSettings = (
  prev: OptimizerSettings | undefined,
  curr: OptimizerSettings,
): {
  changed: boolean;
  optimizationAlgorithm?: [OptimizationAlgorithm, OptimizationAlgorithm];
  learningRate?: [number, number];
} => {
  if (!prev) return { changed: false };
  let optAlgChange: [OptimizationAlgorithm, OptimizationAlgorithm] | undefined =
    undefined;
  let learnRteChange: [number, number] | undefined = undefined;
  if (
    prev.optimizationAlgorithm.toString() !==
    curr.optimizationAlgorithm.toString()
  )
    optAlgChange = [prev.optimizationAlgorithm, curr.optimizationAlgorithm];
  if (prev.learningRate !== curr.learningRate)
    learnRteChange = [prev.learningRate, curr.learningRate];

  return {
    changed: !!optAlgChange || !!learnRteChange,
    optimizationAlgorithm: optAlgChange,
    learningRate: learnRteChange,
  };
};
