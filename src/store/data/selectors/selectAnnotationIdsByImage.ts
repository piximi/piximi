import { createSelector } from "@reduxjs/toolkit";
import { selectAnnotationsByImageObject } from "./selectAnnotationsByImageObject";

export const selectAnnotationIdsByImage = createSelector(
  [selectAnnotationsByImageObject, (state, imageId) => imageId],
  (annotationsByImage, imageId) => {
    return annotationsByImage[imageId];
  }
);
