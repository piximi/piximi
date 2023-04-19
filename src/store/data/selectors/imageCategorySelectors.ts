import { DataStoreSlice } from "types";
import { createSelector } from "@reduxjs/toolkit";
import { UNKNOWN_CLASS_CATEGORY_ID } from "types/Category";
import { sortBy } from "lodash";
import { CATEGORY_COLORS } from "utils/common/colorPalette";

export const selectImageCategories = ({ data }: { data: DataStoreSlice }) => {
  return data.categories.ids;
};
export const selectAllCategories = ({ data }: { data: DataStoreSlice }) => {
  return Object.values(data.categories.entities);
};
export const selectCategoryById =
  (categoryId: string) =>
  ({ data }: { data: DataStoreSlice }) => {
    return data.categories.entities[categoryId];
  };

export const selectCreatedCategories = ({ data }: { data: DataStoreSlice }) => {
  const categories = Object.values(data.categories.entities).filter(
    (category) => category.id !== UNKNOWN_CLASS_CATEGORY_ID
  );

  return sortBy(categories, "name");
};
export const selectCreatedCategoryCount = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return data.categories.ids.length - 1;
};

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

export const selectCategoryEntities = ({ data }: { data: DataStoreSlice }) => {
  return data.categories.entities;
};

export const selectVisibleCategories = createSelector(
  [selectCategoryEntities],
  (categoryEntities) => {
    return Object.values(categoryEntities).filter(
      (category) => category.visible
    );
  }
);

export const selectVisibleCategoryIds = createSelector(
  [selectCategoryEntities],
  (categoryEntities) => {
    return Object.keys(categoryEntities).filter(
      (categoryId) => categoryEntities[categoryId].visible
    );
  }
);
