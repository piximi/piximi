import { createSelector } from "@reduxjs/toolkit";
import { DataStoreSlice } from "types";
import { CATEGORY_COLORS } from "utils/common/colorPalette";

export const selectUnusedCategoryColors = createSelector(
  [({ data }: { data: DataStoreSlice }) => data.categories.entities],
  (allCategories) => {
    const usedCategoryColors = Object.values(allCategories).map(
      (category) => category.color
    );
    const unusedCategoryColors: Array<string> = [];
    Object.values(CATEGORY_COLORS).forEach((color) => {
      if (usedCategoryColors.includes(color)) return;
      unusedCategoryColors.push(color);
    });
    return unusedCategoryColors;
  }
);

export const selectUnusedAnnotationCategoryColors = createSelector(
  [({ data }: { data: DataStoreSlice }) => data.categories.entities],
  (allCategories) => {
    const usedCategoryColors = Object.values(allCategories).map(
      (category) => category.color
    );
    const unusedCategoryColors: Array<string> = [];
    Object.values(CATEGORY_COLORS).forEach((color) => {
      if (usedCategoryColors.includes(color)) return;
      unusedCategoryColors.push(color);
    });
    return unusedCategoryColors;
  }
);
