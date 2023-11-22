import { createSelector } from "@reduxjs/toolkit";
import {
  selectAnnotationEntities,
  selectAnnotationsByCategoryDict,
} from "./annotationSelectors";
import { AnnotationType, Category } from "types";
import { selectAnnotationCategoryEntities } from "../annotation-category/annotationCategorySelectors";
import { selectFilteredAnnotationCategoryIds } from "store/project";

export const selectVisibleAnnotations = createSelector(
  [
    selectFilteredAnnotationCategoryIds,
    selectAnnotationsByCategoryDict,
    selectAnnotationEntities,
    selectAnnotationCategoryEntities,
  ],
  (
    filteredCategories,
    annotationsByCategory,
    annotationEntities,
    annotationCategories
  ) => {
    const visibleAnnotations: Array<AnnotationType & { category: Category }> =
      [];
    for (const categoryId of Object.keys(annotationsByCategory)) {
      if (!filteredCategories.includes(categoryId)) {
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
