import { createSelector } from "@reduxjs/toolkit";
import { selectHiddenImageCategoryIds } from "store/project";
import {
  selectImageEntities,
  selectImagesByCategoryDict,
} from "./imageSelectors";
import { ImageType } from "types";
import { selectImageCategoryEntities } from "../image-category/imageCategorySelectors";

export const selectVisibleImages = createSelector(
  [
    selectHiddenImageCategoryIds,
    selectImagesByCategoryDict,
    selectImageEntities,
    selectImageCategoryEntities,
  ],
  (hiddenCategories, imagesByCategory, imageEntities, imageCategories) => {
    const visibleImages: Array<ImageType & { category: string }> = [];
    for (const categoryId of Object.keys(imagesByCategory)) {
      if (!hiddenCategories.includes(categoryId)) {
        for (const imageId of imagesByCategory[categoryId]) {
          visibleImages.push({
            ...imageEntities[imageId],
            category: imageCategories[categoryId].name,
          });
        }
      }
    }
    return visibleImages;
  }
);
