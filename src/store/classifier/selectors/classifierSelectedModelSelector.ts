import { createSelector } from "@reduxjs/toolkit";
import { Classifier } from "types";
import { availableClassifierModels } from "types/ModelType";

export const classifierSelectedModelSelector = ({
  classifier,
}: {
  classifier: Classifier;
}) => {
  return availableClassifierModels[classifier.selectedModelIdx];
};

export const classifierHistorySelector = createSelector(
  [classifierSelectedModelSelector, (state, items: string[]) => items],
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
