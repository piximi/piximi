import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "store/rootReducer";

import type { ClassifierEvaluationResultType } from "utils/dl/types";
import classifierHandler from "utils/dl/classification/classifierHandler";
import type { SequentialClassifier } from "utils/dl/classification";

import type {
  ClassifierState,
  KindClassifier,
  KindClassifierDict,
  ModelArch,
  ModelInfo,
  ModelLifecycleStatus,
  Run,
  SoftmaxById,
} from "./types";

export const selectClassifierState = ({
  classifier,
}: {
  classifier: ClassifierState;
}): ClassifierState => {
  return classifier;
};

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
);

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
export const selectActiveModel = createSelector(
  selectKindClassifier,
  (kc): SequentialClassifier | undefined => {
    const activeModelName = kc.activeModel;
    if (!activeModelName) return;
    return classifierHandler.getModel(activeModelName);
  },
);
export const selectNewModelArch = createSelector(
  selectKindClassifier,
  (kc): ModelArch => {
    return kc.newModelArch;
  },
);
export const selectModelInfo = createSelector(
  selectKindClassifier,
  (kc): ModelInfo | undefined => {
    const modelName = kc.activeModel;
    if (!modelName) return;
    return kc.modelInfoDict[modelName];
  },
);
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

export const selectConfidenceThreshold = createSelector(
  selectModelInfo,
  (info): number | undefined => info?.confidenceThreshold,
);

export const selectModelEvaluationResults = createSelector(
  [selectRunsForActiveModel],
  (runs): ClassifierEvaluationResultType[] => {
    const evalResults: ClassifierEvaluationResultType[] = [];
    for (const run of runs) {
      if (!run.evalResults) continue;
      evalResults.push(run.evalResults);
    }
    return evalResults;
  },
);
