import { shallowEqual } from "react-redux";

import { createSelector, lruMemoize } from "@reduxjs/toolkit";

import type { RootState } from "store/rootReducer";

import type {
  ModelLifecycleStatus,
  ModelArch,
  ModelInfo,
  Run,
  EvaluationResult,
} from "utils/dl/classification/types";

import type {
  ClassifierState,
  KindClassifier,
  KindClassifierDict,
  SoftmaxById,
} from "./types";

export const selectClassifierState = ({
  classifier,
}: {
  classifier: ClassifierState;
}): ClassifierState => {
  return classifier;
};

/*
 * Kind Classifier Record
 */
export const selectKindClassifierDict = ({
  classifier,
}: {
  classifier: ClassifierState;
}): KindClassifierDict => {
  return classifier.kindClassifiers;
};
export const selectAllCreatedModelNames = createSelector(
  selectKindClassifierDict,
  (kcd): string[] =>
    Object.values(kcd).flatMap((kc) => Object.keys(kc.modelInfoDict)),
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
export const selectModelLifecycleStatus = createSelector(
  selectKindClassifier,
  (kc): ModelLifecycleStatus => kc.status,
);
export const selectActiveSoftmaxById = createSelector(
  selectKindClassifier,
  (kc): SoftmaxById | undefined => kc.activeSoftmaxById,
);
export const selectActiveModelName = createSelector(
  selectKindClassifier,
  (kc): string | undefined => {
    return kc.activeModel;
  },
);
export const selectNewModelArch = createSelector(
  selectKindClassifier,
  (kc): ModelArch => {
    return kc.newModelArch;
  },
);
export const selectKindModelNames = createSelector(selectKindClassifier, (kc) =>
  Object.keys(kc.modelInfoDict),
);

/*
 * Model Info
 */
export const selectModelInfo = createSelector(
  selectKindClassifier,
  (kc): ModelInfo | undefined => {
    const modelName = kc.activeModel;
    if (!modelName) return;
    return kc.modelInfoDict[modelName];
  },
);
export const selectConfidenceThreshold = createSelector(
  selectModelInfo,
  (info): number | undefined => info?.confidenceThreshold,
);
export const selectModelIsValid = createSelector(
  selectModelInfo,
  (info): boolean | undefined => info?.valid,
);
export const selectModelPreprocessSettings = createSelector(
  selectModelInfo,
  (info) => info?.preprocessSettings,
);
export const selectModelOptimizerSettings = createSelector(
  selectModelInfo,
  (info) => info?.optimizerSettings,
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
export const selectActiveRun = createSelector(
  [selectRunsForActiveModel],
  (runs): Run | undefined => runs.at(-1), // undefined if no runs
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
