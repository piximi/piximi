import { createSelector } from "@reduxjs/toolkit";
import { kindClassifierModelDict } from "utils/models/availableClassificationModels";
import { selectActiveKindId } from "../project/selectors";
import {
  selectClassifierModelStatusDict,
  selectedIdxSelector,
} from "./selectors";
import { SequentialClassifier } from "utils/models/classification";
import { ModelStatus } from "utils/models/enums";

export const selectActiveClassifierModelIdx = createSelector(
  selectedIdxSelector,
  selectActiveKindId,
  (modelIdxDict, activeKindId): number => {
    return modelIdxDict[activeKindId];
  },
);

export const selectActiveClassifiers = createSelector(
  selectActiveKindId,
  (activeKindId): Array<SequentialClassifier> => {
    return kindClassifierModelDict[activeKindId];
  },
);

export const selectActiveModelStatuses = createSelector(
  selectActiveKindId,
  selectClassifierModelStatusDict,
  (activeKindId, modelStatuses): Record<string | number, ModelStatus> => {
    return modelStatuses[activeKindId];
  },
);

export const selectActiveClassifierModelStatus = createSelector(
  selectActiveClassifierModelIdx,
  selectActiveModelStatuses,
  (modelIdx, statuses): ModelStatus => {
    return statuses[modelIdx];
  },
);

export const selectActiveClassifierModel = createSelector(
  selectActiveClassifierModelIdx,
  selectActiveClassifiers,
  (selectedActiveKindModelIdx, selectedActiveKindClassifiers) => {
    return selectedActiveKindClassifiers[selectedActiveKindModelIdx];
  },
);

export const selectActiveClassifierHistory = createSelector(
  [selectActiveClassifierModel, (state, items: string[]) => items],
  (model, items) => {
    const fullHistory = model.history.history;
    const selectedHistory: { [key: string]: number[] } = {};
    for (const k of items) {
      if (k === "epochs") {
        selectedHistory[k] = model.history.epochs;
      } else {
        selectedHistory[k] = fullHistory.flatMap(
          (cycleHistory) => cycleHistory[k],
        );
      }
    }
    return selectedHistory;
  },
);

export const selectActiveClassifierModelWithIdx = createSelector(
  selectActiveClassifierModelIdx,
  selectActiveClassifierModel,
  (modelIdx, model) => ({
    idx: modelIdx,
    model,
  }),
);
