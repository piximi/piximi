import { createSelector } from "@reduxjs/toolkit";
import {
  selectAnnotationEntities,
  selectAnnotationsByCategoryDict,
} from "./annotationSelectors";
import { AnnotationType, Category } from "types";
import { selectAnnotationCategoryEntities } from "../annotation-category/annotationCategorySelectors";
import { selectHiddenAnnotationCategoryIds } from "store/imageViewer";

export const selectVisibleAnnotations = createSelector(
  [
    selectHiddenAnnotationCategoryIds,
    selectAnnotationsByCategoryDict,
    selectAnnotationEntities,
    selectAnnotationCategoryEntities,
  ],
  (
    hiddenCategories,
    annotationsByCategory,
    annotationEntities,
    annotationCategories
  ) => {
    const visibleAnnotations: Array<AnnotationType & { category: Category }> =
      [];
    for (const categoryId of Object.keys(annotationsByCategory)) {
      if (!hiddenCategories.includes(categoryId)) {
        for (const annotationId of annotationsByCategory[categoryId]) {
          visibleAnnotations.push({
            ...annotationEntities[annotationId],
            category: annotationCategories[categoryId],
          });
        }
      }
    }
    return visibleAnnotations;
  }
);
