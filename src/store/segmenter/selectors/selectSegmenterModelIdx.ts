import { createSelector } from "@reduxjs/toolkit";
import { SegmenterState } from "store/types";
import { availableSegmenterModels } from "utils/models/availableSegmentationModels";

const selectedIdxSelector = ({ segmenter }: { segmenter: SegmenterState }) =>
  segmenter.selectedModelIdx;

export const selectSegmenterModelIdx = createSelector(
  selectedIdxSelector,
  (idx) => ({
    idx,
    model: availableSegmenterModels[idx],
  })
);
