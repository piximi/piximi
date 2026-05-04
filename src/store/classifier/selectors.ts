import { createSelector } from "@reduxjs/toolkit";

import type { RootState } from "store/rootReducer";

import type { ClassifierState, KindClassifierDict } from "./types";

export const selectClassifier = ({
  classifier,
}: {
  classifier: ClassifierState;
}): ClassifierState => {
  return classifier;
};

export const selectKindClassifiers = ({
  classifier,
}: {
  classifier: ClassifierState;
}): KindClassifierDict => {
  return classifier.kindClassifiers;
};

export const selectShowClearPredictionsWarning = ({
  classifier,
}: {
  classifier: ClassifierState;
}): boolean => {
  return classifier.showClearPredictionsWarning;
};
export const selectModelInfo = createSelector(
  selectKindClassifiers,
  (_state: RootState, kindId: string, modelName: string) => ({
    kindId,
    modelName,
  }),
  (kcs, active) => {
    return kcs[active.kindId]?.modelInfoDict[active.modelName];
  },
);
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
  (info) => info.status,
);
export const selectConfidenceThreshold = createSelector(
  selectModelInfo,
  (info) => info.confidenceThreshold,
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
  (runs) => runs.map((r) => r.evalResults),
);
