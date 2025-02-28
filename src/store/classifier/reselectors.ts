import { createSelector } from "@reduxjs/toolkit";
import { availableClassifierModels } from "utils/models/availableClassificationModels";
import { selectActiveKindId } from "../project/selectors";
import { selectedIdxSelector } from "./selectors";

export const selectActiveKindModelIdx = createSelector(
  selectedIdxSelector,
  selectActiveKindId,
  (selectedModelIdxDict, activeKindId) => {
    return selectedModelIdxDict[activeKindId];
  },
);

export const selectActiveKindClassifiers = createSelector(
  selectActiveKindId,
  (selectedActiveKindId) => {
    return availableClassifierModels[selectedActiveKindId];
  },
);

export const selectClassifierSelectedModel = createSelector(
  selectActiveKindModelIdx,
  selectActiveKindClassifiers,
  (selectedActiveKindModelIdx, selectedActiveKindClassifiers) => {
    return selectedActiveKindClassifiers[selectedActiveKindModelIdx];
  },
);

export const selectClassifierHistory = createSelector(
  [selectClassifierSelectedModel, (state, items: string[]) => items],
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

export const selectClassifierSelectedModelIdx = createSelector(
  selectActiveKindModelIdx,
  selectClassifierSelectedModel,
  (modelIdx, model) => ({
    idx: modelIdx,
    model,
  }),
);
