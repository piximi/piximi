import { createSelector } from "@reduxjs/toolkit";
import { selectAnnotationsByImageEntity } from "./selectDataEntities";

export const selectAnnotationIdsByImage = createSelector(
  [selectAnnotationsByImageEntity, (state, imageId: string) => imageId],
  (annotationsByImage, imageId) => {
    return annotationsByImage[imageId];
  }
);
