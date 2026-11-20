import type {
  Classifier,
  ModelLifecycleStatus,
} from "core/dl/classification/types";

export type SoftmaxById = Record<string, number[]>;
/*
 * One target's classifiers: the records the backend owns, mirrored by id,
 * plus what this session is doing with them (the active one, the
 * architecture a new one would use, the lifecycle status).
 */
export type KindClassifier = {
  modelTargetId: string;
  modelTargetName: string;
  /* The id of the classifier in use; the local backend's ids are names. */
  activeModel: string | undefined;
  /* A listed architecture's model id, for the next classifier. */
  newModelArch: string;
  modelInfoDict: Record<string, Classifier>;
  status: ModelLifecycleStatus;
  activeSoftmaxById?: SoftmaxById;
};

export type KindClassifierDict = Record<string, KindClassifier>;
export type ClassifierState = {
  kindClassifiers: KindClassifierDict;
};
