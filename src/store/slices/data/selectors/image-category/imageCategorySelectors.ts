import { createSelector } from "@reduxjs/toolkit";
import { sortBy } from "lodash";

import { imageCategoriesAdapter } from "../../dataSlice";
import { RootState } from "store/rootReducer";

import { Category, UNKNOWN_IMAGE_CATEGORY_ID } from "types";
import { CATEGORY_COLORS } from "utils/common/colorPalette";

const imageCategorySelectors = imageCategoriesAdapter.getSelectors(
  (state: RootState) => state.data.imageCategories
);

export const selectImageCategoryIds = imageCategorySelectors.selectIds;
export const selectImageCategoryEntities =
  imageCategorySelectors.selectEntities;

export const selectAllImageCategories = imageCategorySelectors.selectAll;

export const selectImageCategoryById = imageCategorySelectors.selectById;

export const selectCreatedImageCategories = createSelector(
  selectAllImageCategories,
  (categories) => {
    const filteredCategories = categories.filter(
      (category) => category.id !== UNKNOWN_IMAGE_CATEGORY_ID
    );
    return sortBy(filteredCategories, "name");
  }
);
export const selectCreatedImageCategoryCount = createSelector(
  selectImageCategoryIds,
  (ids) => {
    return ids.length - 1;
  }
);

export const selectVisibleImageCategories = createSelector(
  selectAllImageCategories,
  (entities) => {
    return entities.filter((entity) => entity.visible);
  }
);

export const selectVisibleCategoryIds = createSelector(
  [selectVisibleImageCategories],
  (visibleCategories) => {
    return visibleCategories.map((category) => category.id);
  }
);

export const selectUsedImageCategoryColors = createSelector(
  selectCreatedImageCategories,
  (categories) => {
    return categories.map((category) => category.color);
  }
);

export const selectUnusedImageCategoryColors = createSelector(
  selectUsedImageCategoryColors,
  (usedColors) => {
    const unusedCategoryColors: Array<string> = [];
    Object.values(CATEGORY_COLORS).forEach((color) => {
      if (usedColors.includes(color)) return;
      unusedCategoryColors.push(color);
    });
    return unusedCategoryColors;
  }
);

export const selectImageCategoryNames = createSelector(
  selectAllImageCategories,
  (categories) => {
    return categories.map((category) => category.name);
  }
);

export const selectImageCategoryProperty = createSelector(
  selectImageCategoryEntities,
  (entities) =>
    <S extends keyof Category>(id: string, property: S) => {
      const category = entities[id];
      if (!category) return;
      return category[property];
    }
);
