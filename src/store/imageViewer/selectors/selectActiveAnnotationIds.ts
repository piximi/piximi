import { createSelector } from "@reduxjs/toolkit";
import { activeImageIdSelector } from "./activeImageIdSelector";
import { selectAnnotationsByImageDict } from "store/data/selectors/annotation/annotationSelectors";

export const selectActiveAnnotationIds = createSelector(
  [activeImageIdSelector, selectAnnotationsByImageDict],
  (imageId, annotationsByImage) => {
    if (!imageId) return [];
    return annotationsByImage[imageId];
  }
);

export const selectActiveAnnotationIdsCount = createSelector(
  selectActiveAnnotationIds,
  (activeIds): number => {
    return activeIds.length;
  }
);
