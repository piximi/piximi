import { createSelector } from "@reduxjs/toolkit";

import {
  selectedAnnotationsSelector,
  activeImageSelector,
} from "store/image-viewer";
import { annotationCategoriesSelector } from "store/project";

import {
  decodedAnnotationType,
  Category,
  UNKNOWN_ANNOTATION_CATEGORY,
} from "types";

export const selectedAnnotationObjectsSelector = createSelector(
  [
    activeImageSelector,
    annotationCategoriesSelector,
    selectedAnnotationsSelector,
  ],
  (activeImage, categories, selectedAnnotations) => {
    if (!activeImage) return [];

    const getFillColor = (annotation: decodedAnnotationType) => {
      const annotationCategory = categories.find(
        (category: Category) => category.id === annotation.categoryId
      );

      return annotationCategory
        ? annotationCategory.color
        : UNKNOWN_ANNOTATION_CATEGORY.id;
    };

    return selectedAnnotations.map((annotation: decodedAnnotationType) => {
      return {
        annotation: annotation,
        imageShape: activeImage.shape,
        fillColor: getFillColor(annotation),
      };
    });
  }
);
