import { createSelector } from "@reduxjs/toolkit";
import { selectSelectedAnnotationCategoryId } from "store/imageViewer";
import { selectAnnotationCategoryEntities } from "./annotationCategorySelectors";

export const selectSelectedAnnotationCategory = createSelector(
  [selectSelectedAnnotationCategoryId, selectAnnotationCategoryEntities],
  (selectedId, categoryEntities) => {
    return categoryEntities[selectedId];
  }
);
