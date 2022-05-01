import { AnnotationType } from "../../types/AnnotationType";
import { Category, UNKNOWN_ANNOTATION_CATEGORY } from "types/Category";
import { createSelector } from "@reduxjs/toolkit";
import { activeImageSelector } from "./activeImageSelector";
import { annotatorCategoriesSelector } from "./annotatorCategoriesSelector";
import { selectedAnnotationsSelector } from "./selectedAnnotationsSelector";

export const unselectedAnnotationObjectsSelector = createSelector(
  [
    activeImageSelector,
    annotatorCategoriesSelector,
    selectedAnnotationsSelector,
  ],
  (activeImage, categories, selectedAnnotations) => {
    if (!activeImage) return [];

    const getFillColor = (annotation: AnnotationType) => {
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
      (annotation: AnnotationType) => {
        return annotation.id;
      }
    );

    const visibleUnselectedAnnotations = activeImage.annotations
      .filter((annotation: AnnotationType) => {
        return !selectedAnnotationIDs.includes(annotation.id);
      })
      .filter((annotation: AnnotationType) => {
        return (
          visibleCategories.includes(annotation.categoryId) &&
          annotation.plane === activeImage?.activePlane
        );
      });

    return visibleUnselectedAnnotations.map(
      (visibleUnselectedAnnotation: AnnotationType) => {
        return {
          annotation: visibleUnselectedAnnotation,
          imageShape: activeImage.shape,
          fillColor: getFillColor(visibleUnselectedAnnotation),
        };
      }
    );
  }
);
