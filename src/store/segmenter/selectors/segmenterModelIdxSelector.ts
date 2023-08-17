import { createSelector } from "@reduxjs/toolkit";
import { SegmenterStoreType } from "types";
import { availableSegmenterModels } from "types/ModelType";

const selectedIdxSelector = ({
  segmenter,
}: {
  segmenter: SegmenterStoreType;
}) => segmenter.selectedModelIdx;

export const segmenterModelIdxSelector = createSelector(
  selectedIdxSelector,
  (idx) => ({
    idx,
    model: availableSegmenterModels[idx],
  })
);
