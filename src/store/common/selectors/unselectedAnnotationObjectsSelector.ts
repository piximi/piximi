import { createSelector } from "@reduxjs/toolkit";

import { activeImageSelector } from "store/common";
import { selectedAnnotationsSelector } from "store/image-viewer";
import { annotationCategoriesSelector } from "store/project";

import {
  bufferedAnnotationType,
  encodedAnnotationType,
  Category,
  UNKNOWN_ANNOTATION_CATEGORY,
} from "types";
import { decode } from "utils/annotator";

export const unselectedAnnotationObjectsSelector = createSelector(
  [
    activeImageSelector,
    annotationCategoriesSelector,
    selectedAnnotationsSelector,
  ],
  (activeImage, categories, selectedAnnotations) => {
    if (!activeImage) return [];

    const getFillColor = (annotation: encodedAnnotationType) => {
      const annotationCategory = categories.find(
        (category: Category) => category.id === annotation.categoryId
      );
      return annotationCategory
        ? annotationCategory.color
        : UNKNOWN_ANNOTATION_CATEGORY.color;
    };

    const visibleCategories = categories
      .filter((category) => category.visible)
      .map((category) => {
        return category.id;
      });

    const selectedAnnotationIDs = selectedAnnotations.map(
      (annotation: bufferedAnnotationType) => {
        return annotation.id;
      }
    );

    const visibleUnselectedAnnotations = activeImage.annotations
      .filter((annotation: encodedAnnotationType) => {
        return !selectedAnnotationIDs.includes(annotation.id);
      })
      .filter((annotation: encodedAnnotationType) => {
        return (
          visibleCategories.includes(annotation.categoryId) &&
          annotation.plane === activeImage?.activePlane
        );
      });

    return visibleUnselectedAnnotations.map(
      (visibleUnselectedAnnotation: encodedAnnotationType) => {
        const { mask, ...buffered } = {
          maskData: Uint8Array.from(decode(visibleUnselectedAnnotation.mask)),
          ...visibleUnselectedAnnotation,
        };
        return {
          annotation: buffered,
          imageShape: activeImage.shape,
          fillColor: getFillColor(visibleUnselectedAnnotation),
        };
      }
    );
  }
);
