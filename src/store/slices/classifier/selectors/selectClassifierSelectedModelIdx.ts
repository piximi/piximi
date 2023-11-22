import { createSelector } from "@reduxjs/toolkit";
import { Classifier } from "types";
import { availableClassifierModels } from "types/ModelType";

const selectedIdxSelector = ({ classifier }: { classifier: Classifier }) =>
  classifier.selectedModelIdx;

export const selectClassifierSelectedModelIdx = createSelector(
  selectedIdxSelector,
  (idx) => ({
    idx,
    model: availableClassifierModels[idx],
  })
);
