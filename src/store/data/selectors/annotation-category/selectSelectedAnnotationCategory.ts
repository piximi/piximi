import { createSelector } from "@reduxjs/toolkit";
import { selectedAnnotationCategoryIdSelector } from "store/imageViewer";
import { selectAnnotationCategoryEntities } from "./annotationCategorySelectors";

export const selectSelectedAnnotationCategory = createSelector(
  [selectedAnnotationCategoryIdSelector, selectAnnotationCategoryEntities],
  (selectedId, categoryEntities) => {
    return categoryEntities[selectedId];
  }
);
