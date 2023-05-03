import { createSelector } from "@reduxjs/toolkit";
import { sortBy } from "lodash";

import { annotationCategoriesAdapter } from "../dataSlice";
import { RootState } from "store/reducer/reducer";
import { selectedAnnotationCategoryIdSelector } from "store/imageViewer";

import { UNKNOWN_ANNOTATION_CATEGORY_ID } from "types";
import { CATEGORY_COLORS } from "utils/common/colorPalette";

export const annotationCategorySelectors =
  annotationCategoriesAdapter.getSelectors(
    (state: RootState) => state.data.annotationCategories
  );

export const selectAnnotationCategoryIds =
  annotationCategorySelectors.selectIds;
export const selectAnnotationCategoryEntities =
  annotationCategorySelectors.selectEntities;
export const selectAllAnnotationCategories =
  annotationCategorySelectors.selectAll;
export const selectAnnotationCategoryById =
  annotationCategorySelectors.selectById;

export const selectCreatedAnnotationCategories = createSelector(
  selectAllAnnotationCategories,
  (categories) => {
    const filteredCategories = categories.filter(
      (category) => category.id !== UNKNOWN_ANNOTATION_CATEGORY_ID
    );

    return sortBy(filteredCategories, "name");
  }
);
export const selectCreatedAnnotationCategoryCount = createSelector(
  selectAnnotationCategoryIds,
  (ids) => {
    return ids.length - 1;
  }
);

export const selectAllVisibleAnnotationCategories = createSelector(
  selectAllAnnotationCategories,
  (entities) => {
    return entities.filter((entity) => entity.visible);
  }
);

export const selectSelectedAnnotationCategory = createSelector(
  [selectedAnnotationCategoryIdSelector, selectAnnotationCategoryEntities],
  (selectedId, categoryEntities) => {
    return categoryEntities[selectedId];
  }
);

export const selectUsedAnnotationCategoryColors = createSelector(
  selectCreatedAnnotationCategories,
  (categories) => {
    return categories.map((category) => category.color);
  }
);
export const selectUnusedAnnotationCategoryColors = createSelector(
  selectUsedAnnotationCategoryColors,
  (usedColors) => {
    const unusedCategoryColors: Array<string> = [];
    Object.values(CATEGORY_COLORS).forEach((color) => {
      if (usedColors.includes(color)) return;
      unusedCategoryColors.push(color);
    });
    return unusedCategoryColors;
  }
);

export const selectAnnotationCategoryNames = createSelector(
  selectAllAnnotationCategories,
  (categories) => {
    return categories.map((category) => category.name);
  }
);
