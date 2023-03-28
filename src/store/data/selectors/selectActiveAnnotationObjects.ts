import { createSelector } from "@reduxjs/toolkit";

import { decodeAnnotation } from "utils/annotator";
import { selectActiveAnnotationIds } from "store/imageViewer";
import { selectActiveImageShape } from "./selectActiveImageAttributes";
import {
  selectAnnotationCategoryEntities,
  selectAnnotationEntities,
  selectStagedAnnotationEntities,
} from "./selectDataEntities";

// Note: re-selects on activeImageId, image.entities, annotationsByImage, annotations.entities, annotationCategories.entities
export const selectActiveAnnotationObjects = createSelector(
  [
    selectActiveImageShape,
    selectActiveAnnotationIds,
    selectAnnotationEntities,
    selectStagedAnnotationEntities,
    selectAnnotationCategoryEntities,
  ],
  (
    activeImageShape,
    activeAnnotationIds,
    annotationEntities,
    stagedAnnotationEntities,
    categoryEntities
  ) => {
    if (!activeImageShape) return [];

    const annotationObjects = activeAnnotationIds.map((annotationId) => {
      let encodedAnnotation = annotationEntities[annotationId]!;
      if (stagedAnnotationEntities[annotationId]) {
        encodedAnnotation = {
          ...annotationEntities[annotationId]!,
          ...stagedAnnotationEntities[annotationId]!,
        };
      }
      const annotation = decodeAnnotation(encodedAnnotation)!;

      const fillColor = categoryEntities[annotation.categoryId].color;
      return {
        annotation,
        fillColor,
        imageShape: activeImageShape,
      };
    });

    return annotationObjects;
  }
);
