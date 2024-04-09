import { createSelector } from "@reduxjs/toolkit";
import { ClassifierState } from "store/types";
import { availableClassifierModels } from "utils/models/availableClassificationModels";

const selectedIdxSelector = ({ classifier }: { classifier: ClassifierState }) =>
  classifier.selectedModelIdx;

export const selectClassifierSelectedModelIdx = createSelector(
  selectedIdxSelector,
  (idx) => ({
    idx,
    model: availableClassifierModels[idx],
  })
);
