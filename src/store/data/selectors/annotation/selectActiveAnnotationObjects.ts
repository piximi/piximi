import { createSelector } from "@reduxjs/toolkit";

import {
  selectActiveAnnotationIds,
  selectWorkingAnnotation,
} from "store/imageViewer";
import { selectActiveImageShape } from "../image/selectActiveImageAttributes";
import { selectAnnotationCategoryEntities } from "../annotation-category/annotationCategorySelectors";
import { selectAnnotationEntities } from "./annotationSelectors";

import { DecodedAnnotationType, Shape } from "types";
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
        annotationId === workingAnnotation?.id
      )
        continue;
      const annotation = decodeAnnotation(annotationEntities[annotationId])!;

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
  (workingAnnotation, activeImageShape, categoryEntities) => {
    if (!workingAnnotation || !activeImageShape) return [];
    const annotation = decodeAnnotation(workingAnnotation)!;
    const fillColor = categoryEntities[workingAnnotation.categoryId].color;
    const imageShape = activeImageShape;
    console.log(annotation, fillColor, imageShape);
    return [
      {
        annotation: decodeAnnotation(workingAnnotation)!,
        fillColor: categoryEntities[workingAnnotation.categoryId].color,
        imageShape: activeImageShape,
      },
    ];
  }
);
