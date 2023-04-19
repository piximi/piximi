import { UNKNOWN_ANNOTATION_CATEGORY_ID } from "types/Category";
import { sortBy } from "lodash";
import { annotationCategoriesAdapter } from "../dataSlice";
import { RootState } from "store/reducer/reducer";
import { createSelector } from "@reduxjs/toolkit";
import { selectedAnnotationCategoryIdSelector } from "store/imageViewer";

export const annotationCategorySelectors =
  annotationCategoriesAdapter.getSelectors(
    (state: RootState) => state.data.annotationCategories_
  );
export const selectAllAnnotationCategories =
  annotationCategorySelectors.selectAll;

export const selectAnnotationCategoryIds =
  annotationCategorySelectors.selectIds;

export const selectAnnotationCategoryEntities =
  annotationCategorySelectors.selectEntities;

export const selectAllVisibleAnnotationCategories = createSelector(
  selectAllAnnotationCategories,
  (entities) => {
    return entities.filter((entity) => entity.visible);
  }
);

export const selectAnnotationCategoryById =
  annotationCategorySelectors.selectById;

export const selectCreatedAnnotatorCategories = createSelector(
  selectAllAnnotationCategories,
  (categories) => {
    const filteredCategories = categories.filter(
      (category) => category.id !== UNKNOWN_ANNOTATION_CATEGORY_ID
    );

    return sortBy(filteredCategories, "name");
  }
);

export const selectSelectedAnnotationCategory = createSelector(
  [selectedAnnotationCategoryIdSelector, selectAnnotationCategoryEntities],
  (selectedId, categoryEntities) => {
    return categoryEntities[selectedId];
  }
);
