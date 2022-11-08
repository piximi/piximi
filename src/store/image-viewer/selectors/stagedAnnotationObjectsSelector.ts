import { createSelector } from "@reduxjs/toolkit";

import {
  stagedAnnotationsSelector,
  workingAnnotationIdSelector,
  activeImageSelector,
} from "store/image-viewer";
import { annotationCategoriesSelector } from "store/project";

import {
  decodedAnnotationType,
  Category,
  UNKNOWN_ANNOTATION_CATEGORY,
  Shape,
} from "types";

type AnnotationObject = {
  annotation: decodedAnnotationType;
  imageShape: Shape;
  fillColor: string;
};

export const stagedAnnotationObjectsSelector = createSelector(
  [
    activeImageSelector,
    annotationCategoriesSelector,
    stagedAnnotationsSelector,
    workingAnnotationIdSelector,
  ],
  (activeImage, categories, stagedAnnotations, workingId) => {
    if (!activeImage) return [];

    const getFillColor = (annotation: decodedAnnotationType) => {
      const annotationCategory = categories.find(
        (category: Category) => category.id === annotation.categoryId
      );

      return annotationCategory
        ? annotationCategory.color
        : UNKNOWN_ANNOTATION_CATEGORY.id;
    };

    const reducedAnnotations: AnnotationObject[] = stagedAnnotations.reduce(
      (objectArray: AnnotationObject[], annotation: decodedAnnotationType) => {
        if (workingId !== annotation.id) {
          objectArray.push({
            annotation: annotation,
            imageShape: activeImage.shape,
            fillColor: getFillColor(annotation),
          });
        }
        return objectArray;
      },
      []
    );

    return reducedAnnotations;
  }
);
