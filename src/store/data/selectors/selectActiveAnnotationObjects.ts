import { createSelector } from "@reduxjs/toolkit";

import { decodeAnnotation } from "utils/annotator";
import { selectActiveAnnotationIds } from "store/imageViewer";
import { selectActiveImageShape } from "./selectActiveImageAttributes";
import { selectAnnotationCategoryEntities } from "./annotationCategorySelectors";
import {
  selectAnnotationEntities,
  selectStagedAnnotationEntities,
} from "./annotationSelectors";
import { AnnotationType, DecodedAnnotationType, Shape } from "types";

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
  ): Array<{
    annotation: DecodedAnnotationType;
    fillColor: string;
    imageShape: Shape;
  }> => {
    if (!activeImageShape) return [];

    const annotationObjects: Array<{
      annotation: DecodedAnnotationType;
      fillColor: string;
      imageShape: Shape;
    }> = [];

    for (const annotationId of activeAnnotationIds) {
      if (
        stagedAnnotationEntities[annotationId] &&
        stagedAnnotationEntities[annotationId]?.deleted
      ) {
        continue;
      }
      const encodedAnnotation = {
        ...annotationEntities[annotationId],
        ...stagedAnnotationEntities[annotationId],
      } as AnnotationType;

      const annotation = decodeAnnotation(encodedAnnotation)!;

      const fillColor = categoryEntities[annotation.categoryId].color;
      annotationObjects.push({
        annotation,
        fillColor,
        imageShape: activeImageShape,
      });
    }

    return annotationObjects;
  }
);
