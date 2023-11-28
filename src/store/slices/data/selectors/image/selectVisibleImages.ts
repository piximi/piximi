import { createSelector } from "@reduxjs/toolkit";
import {
  selectHiddenImageCategoryIds,
  selectImageFilters,
} from "store/slices/project";
import {
  selectImageEntities,
  selectImagesByCategoryDict,
} from "./imageSelectors";
import { Category, ImageType } from "types";
import { selectImageCategoryEntities } from "../image-category/imageCategorySelectors";
//import { filterObjects } from "utils/common";

export const selectVisibleImages = createSelector(
  [
    selectHiddenImageCategoryIds,
    selectImagesByCategoryDict,
    selectImageEntities,
    selectImageCategoryEntities,
    selectImageFilters,
  ],
  (
    hiddenCategories,
    imagesByCategory,
    imageEntities,
    imageCategories,
    imageFilters
  ) => {
    // const t0 = performance.now();
    // const visibleImages: Array<ImageType & { category: Category }> =
    //   filterObjects(Object.values(imageEntities), imageFilters).map(
    //     (image) => ({ ...image, category: imageCategories[image.categoryId] })
    //   );
    // const t1 = performance.now();

    //const t0 = performance.now();
    const visibleImages: Array<ImageType & { category: Category }> = [];

    for (const categoryId of Object.keys(imagesByCategory)) {
      if (!imageFilters.categoryId.includes(categoryId)) {
        for (const imageId of imagesByCategory[categoryId]) {
          if (
            !imageFilters.partition.includes(imageEntities[imageId].partition)
          ) {
            visibleImages.push({
              ...imageEntities[imageId],
              category: imageCategories[categoryId],
            });
          }
        }
      }
    }
    //const t1 = performance.now();
    //console.log("Duration: ", t1 - t0);
    return visibleImages;
  }
);
