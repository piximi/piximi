import type { ModelLifecycleStatus } from "store/classifier/types";

export type SettingsType = "architecture" | "tunable";

export const isFieldLocked = (
  tier: SettingsType,
  lifecycleStatus: ModelLifecycleStatus,
  pretrained: boolean,
): boolean => {
  if (lifecycleStatus === "training") return true; // anything in flight is locked
  if (tier === "architecture") return pretrained;
  return false; // tunable fields editable across runs
};
