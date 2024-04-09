import { createSelector } from "@reduxjs/toolkit";
import { ClassifierState } from "store/types";
import { availableClassifierModels } from "utils/models/availableClassificationModels";

export const selectClassifierSelectedModel = ({
  classifier,
}: {
  classifier: ClassifierState;
}) => {
  return availableClassifierModels[classifier.selectedModelIdx];
};

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
          (cycleHistory) => cycleHistory[k]
        );
      }
    }
    return selectedHistory;
  }
);
