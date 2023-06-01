import { createSelector } from "@reduxjs/toolkit";
import { selectHiddenImageCategoryIds } from "store/project";
import {
  selectImageEntities,
  selectImagesByCategoryDict,
} from "./imageSelectors";
import { ImageType } from "types";

export const selectVisibleImages = createSelector(
  [
    selectHiddenImageCategoryIds,
    selectImagesByCategoryDict,
    selectImageEntities,
  ],
  (hiddenCategories, imagesByCategory, imageEntities) => {
    const visibleImages: ImageType[] = [];
    for (const categoryId of Object.keys(imagesByCategory)) {
      if (!hiddenCategories.includes(categoryId)) {
        for (const imageId of imagesByCategory[categoryId]) {
          visibleImages.push(imageEntities[imageId]);
        }
      }
    }
    return visibleImages;
  }
);
