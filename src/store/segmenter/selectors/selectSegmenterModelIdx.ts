import { createSelector } from "@reduxjs/toolkit";
import { Segmenter } from "types";
import { availableSegmenterModels } from "types/ModelType";

const selectedIdxSelector = ({ segmenter }: { segmenter: Segmenter }) =>
  segmenter.selectedModelIdx;

export const selectSegmenterModelIdx = createSelector(
  selectedIdxSelector,
  (idx) => ({
    idx,
    model: availableSegmenterModels[idx],
  })
);
