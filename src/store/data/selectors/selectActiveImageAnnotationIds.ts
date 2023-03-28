import { createSelector } from "@reduxjs/toolkit";
import { activeImageIdSelector } from "store/annotator";
import { selectAnnotationsByImageObject } from "./selectAnnotationsByImageObject";

export const selectActiveImageAnnotationIds = createSelector(
  [activeImageIdSelector, selectAnnotationsByImageObject],
  (imageId, annotationsByImage) => {
    if (!imageId) return [];
    return annotationsByImage[imageId];
  }
);
