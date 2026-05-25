import type {
  OptimizerSettings,
  PreprocessSettings,
} from "utils/dl/classification/types";

export type SettingsType = "architecture" | "integrity" | "tunable";

export const isFieldLocked = (
  tier: SettingsType,
  lifecycleStatus: ModelLifecycleStatus,
  pretrained: boolean,
): boolean => {
  if (lifecycleStatus === "training") return true; // anything in flight is locked
  if (tier === "architecture" || tier === "integrity") return pretrained;
  return false; // tunable fields editable across runs
};

export const lockReason = (
  tier: SettingsType,
  lifecycleStatus: ModelLifecycleStatus,
) => {
  if (lifecycleStatus === "training")
    return "Wait for training to complete before editing parameters"; // anything in flight is locked
  if (tier === "architecture")
    return "Architecture settings can not be changed from initial values";
  if (tier === "integrity")
    return "Changing this value will invalidate the run-over-run comparibility of the model";
};

export const diffCompileSettings = (
  prev: OptimizerSettings | undefined,
  curr: OptimizerSettings,
): boolean => {
  if (!prev) return false;
  let changed: boolean = false;

  if (
    prev.optimizationAlgorithm !== curr.optimizationAlgorithm ||
    prev.learningRate !== curr.learningRate
  )
    changed = true;
  return changed;
};
