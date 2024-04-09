import { createSelector } from "@reduxjs/toolkit";
import { SegmenterState } from "store/types";
import { availableSegmenterModels } from "utils/models/availableSegmentationModels";

export const selectSegmenterModel = ({
  segmenter,
}: {
  segmenter: SegmenterState;
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
