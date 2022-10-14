import { createSelector } from "@reduxjs/toolkit";

import { activeImageSelector } from "./activeImageSelector";
import { selectedAnnotationsSelector } from "store/image-viewer";
import { annotationCategoriesSelector } from "store/project";

import {
  bufferedAnnotationType,
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

    const getFillColor = (annotation: bufferedAnnotationType) => {
      const annotationCategory = categories.find(
        (category: Category) => category.id === annotation.categoryId
      );

      return annotationCategory
        ? annotationCategory.color
        : UNKNOWN_ANNOTATION_CATEGORY.id;
    };

    return selectedAnnotations.map((annotation: bufferedAnnotationType) => {
      return {
        annotation: annotation,
        imageShape: activeImage.shape,
        fillColor: getFillColor(annotation),
      };
    });
  }
);
