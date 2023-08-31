import { createSelector } from "@reduxjs/toolkit";
import { SegmenterStoreType } from "types";
import { availableSegmenterModels } from "types/ModelType";

export const selectSegmenterModel = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}) => {
  return availableSegmenterModels[segmenter.selectedModelIdx];
};

export const selectSegmenterHistory = createSelector(
  [selectSegmenterModel, (state, items: string[]) => items],
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
