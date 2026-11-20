import { shallowEqual } from "react-redux";

import { createSelector, lruMemoize } from "@reduxjs/toolkit";

import type {
  Classifier,
  ModelLifecycleStatus,
  Run,
  EvaluationResult,
} from "core/dl/classification/types";

import type { RootState } from "store/rootReducer";

import type {
  ClassifierState,
  KindClassifier,
  KindClassifierDict,
  SoftmaxById,
} from "./types";

/*
 * Kind Classifier Record
 */
const selectKindClassifierDict = ({
  classifier,
}: {
  classifier: ClassifierState;
}): KindClassifierDict => {
  return classifier.kindClassifiers;
};
export const selectAllCreatedModelNames = createSelector(
  selectKindClassifierDict,
  (kcd): string[] =>
    Object.values(kcd).flatMap((kc) =>
      Object.values(kc.modelInfoDict).map((c) => c.name),
    ),
  {
    memoize: lruMemoize,
    memoizeOptions: { resultEqualityCheck: shallowEqual },
  },
);

/*
 * Kind Classifier
 */
export const selectKindClassifier = createSelector(
  selectKindClassifierDict,
  (_state: RootState, kindId: string) => kindId,
  (kci, kindId): KindClassifier => {
    const kc = kci[kindId];
    if (!kc) {
      throw new Error(`No classifiers for kind ${kindId}`);
    }
    return kc;
  },
);
/* What the backend is doing with the active classifier wins over what this
 * session set, so another client's training shows here too. */
export const selectModelLifecycleStatus = createSelector(
  selectKindClassifier,
  (kc): ModelLifecycleStatus =>
    (kc.activeModel && kc.modelInfoDict[kc.activeModel]?.busy) || kc.status,
);
export const selectIsModelTrained = createSelector(
  selectKindClassifier,
  (kc) => {
    const activeModel = kc.activeModel;
    if (!activeModel) return false;
    return !!kc.modelInfoDict[activeModel].trained;
  },
);
export const selectActiveSoftmaxById = createSelector(
  selectKindClassifier,
  (kc): SoftmaxById | undefined => kc.activeSoftmaxById,
);
/* The active classifier's id (a name, for the local backend). */
export const selectActiveModelName = createSelector(
  selectKindClassifier,
  (kc): string | undefined => {
    return kc.activeModel;
  },
);
export const selectActiveClassifierName = createSelector(
  selectKindClassifier,
  (kc): string | undefined =>
    kc.activeModel ? kc.modelInfoDict[kc.activeModel]?.name : undefined,
);

export const selectKindClassifiers = createSelector(
  selectKindClassifier,
  (kc): Classifier[] => Object.values(kc.modelInfoDict),
);

/*
 * The active classifier's record
 */
const selectModelInfo = createSelector(
  selectKindClassifier,
  (kc): Classifier | undefined => {
    const modelName = kc.activeModel;
    if (!modelName) return;
    return kc.modelInfoDict[modelName];
  },
);
export const selectActiveClassifier = selectModelInfo;

export const selectModelIsValid = createSelector(
  selectModelInfo,
  (info): boolean | undefined => info?.valid,
);
export const selectModelIsTrained = createSelector(
  selectModelInfo,
  (info): boolean | undefined => info?.trained,
);
export const selectModelPreprocessSettings = createSelector(
  selectModelInfo,
  (info) => info?.hyperparameters.preprocess,
);
export const selectModelOptimizerSettings = createSelector(
  selectModelInfo,
  (info) => info?.hyperparameters.optimizer,
);
export const selectModelTargetName = createSelector(
  selectKindClassifier,
  (kc) => kc.modelTargetName,
);
export const selectNewModelArch = createSelector(
  selectKindClassifier,
  (kc) => kc.newModelArch,
);

/*
 * Active Runs
 */
export const selectRunsForActiveModel = createSelector(
  selectModelInfo,
  (info): Run[] => {
    return info?.runs ?? [];
  },
);
export const selectModelEvaluationResults = createSelector(
  [selectRunsForActiveModel],
  (runs): EvaluationResult[] => {
    const evalResults: EvaluationResult[] = [];
    for (const run of runs) {
      if (!run.evalResults) continue;
      evalResults.push(run.evalResults);
    }
    return evalResults;
  },
);
