import type {
  ModelArch,
  ModelInfo,
  ModelLifecycleStatus,
} from "utils/dl/classification/types";

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
