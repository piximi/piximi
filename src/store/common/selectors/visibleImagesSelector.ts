import { createSelector } from "@reduxjs/toolkit";
import { categoriesSelector, imagesSelector } from "store/project";
import { Category, OldImageType } from "types";

export const visibleImagesSelector = createSelector(
  [imagesSelector, categoriesSelector],
  (images, categories) => {
    const visibleCategoryImages = images.filter((image: OldImageType) => {
      const category = categories.find(
        (c: Category) => c.id === image.categoryId
      );
      return category ? category.visible : true;
    });

    return visibleCategoryImages.filter((image: OldImageType) => image.visible);
  }
);
