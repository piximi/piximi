import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "store/rootReducer";

import type { ClassifierEvaluationResultType } from "utils/dl/types";

import { BASE_MODEL_NAME } from "./constants";

import type {
  ClassifierState,
  KindClassifier,
  KindClassifierDict,
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

export const selectShowClearPredictionsWarning = ({
  classifier,
}: {
  classifier: ClassifierState;
}): boolean => {
  return classifier.showClearPredictionsWarning;
};

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
export const selectActiveModelName = createSelector(
  selectKindClassifier,
  (kc) => {
    return kc.activeModel;
  },
);
export const selectNewModelArch = createSelector(selectKindClassifier, (kc) => {
  return kc.newModelArch;
});
export const selectModelInfo = createSelector(selectKindClassifier, (kc) => {
  const modelName = kc.activeModel ?? BASE_MODEL_NAME;
  return kc.modelInfoDict[modelName];
});
export const selectRunsForActiveModel = createSelector(
  selectModelInfo,
  (info) => {
    return info?.runs ?? [];
  },
);

export const selectActiveRun = createSelector(
  [selectRunsForActiveModel],
  (runs) => runs[runs.length - 1], // undefined if no runs
);

export const selectModelLifecycleStatus = createSelector(
  selectModelInfo,
  (info) => info?.status,
);
export const selectConfidenceThreshold = createSelector(
  selectModelInfo,
  (info) => info?.confidenceThreshold,
);
export const selectIsModelStale = createSelector(
  [selectModelLifecycleStatus],
  (s) => s === "stale",
);
export const selectIsModelInvalid = createSelector(
  [selectModelLifecycleStatus],
  (s) => s === "invalid",
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
