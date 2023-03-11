import { createSelector } from "@reduxjs/toolkit";

import {
  selectedAnnotationsSelector,
  activeImageSelector,
} from "store/annotator";
import { annotationCategoriesSelector } from "store/project";

import {
  DecodedAnnotationType,
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

    const getFillColor = (annotation: DecodedAnnotationType) => {
      const annotationCategory = categories.find(
        (category: Category) => category.id === annotation.categoryId
      );

      return annotationCategory
        ? annotationCategory.color
        : UNKNOWN_ANNOTATION_CATEGORY.id;
    };

    return selectedAnnotations.map((annotation: DecodedAnnotationType) => {
      return {
        annotation: annotation,
        imageShape: activeImage.shape,
        fillColor: getFillColor(annotation),
      };
    });
  }
);
