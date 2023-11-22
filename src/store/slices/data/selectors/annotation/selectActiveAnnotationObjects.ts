import { createSelector } from "@reduxjs/toolkit";

import {
  selectActiveAnnotationIds,
  selectWorkingAnnotation,
} from "store/slices/imageViewer";
import { selectActiveImageShape } from "../image/selectActiveImageAttributes";
import { selectAnnotationCategoryEntities } from "../annotation-category/annotationCategorySelectors";
import { selectAnnotationEntities } from "./annotationSelectors";

import { AnnotationType, DecodedAnnotationType, Shape } from "types";
import { decodeAnnotation } from "utils/annotator";

// Note: re-selects on activeImageId, image.entities, annotationsByImage, annotations.entities, annotationCategories.entities
export const selectActiveAnnotationObjects = createSelector(
  [
    selectActiveImageShape,
    selectActiveAnnotationIds,
    selectAnnotationEntities,
    selectAnnotationCategoryEntities,
    selectWorkingAnnotation,
  ],
  (
    activeImageShape,
    activeAnnotationIds,
    annotationEntities,
    categoryEntities,
    workingAnnotation
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
        !annotationEntities[annotationId] ||
        annotationId === workingAnnotation.saved?.id
      )
        continue;

      const annotation = !annotationEntities[annotationId].decodedMask
        ? decodeAnnotation(annotationEntities[annotationId])
        : (annotationEntities[annotationId] as DecodedAnnotationType);

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

export const selectWorkingAnnotationObject = createSelector(
  [
    selectWorkingAnnotation,
    selectActiveImageShape,
    selectAnnotationCategoryEntities,
  ],
  (workingAnnotationEntity, activeImageShape, categoryEntities) => {
    if (!workingAnnotationEntity.saved || !activeImageShape) return;
    const workingAnnotation = {
      ...workingAnnotationEntity.saved,
      ...workingAnnotationEntity.changes,
    } as AnnotationType;
    const annotation = !workingAnnotation.decodedMask
      ? decodeAnnotation(workingAnnotation)
      : (workingAnnotation as DecodedAnnotationType);
    const fillColor = categoryEntities[workingAnnotation.categoryId].color;
    const imageShape = activeImageShape;
    return {
      annotation: annotation,
      fillColor: fillColor,
      imageShape: imageShape,
    };
  }
);
