import { createSelector } from "@reduxjs/toolkit";
import { ImageType } from "types/ImageType";
import { Category } from "types/Category";
import { categoriesSelector, imagesSelector } from ".";

export const visibleImagesSelector = createSelector(
  [imagesSelector, categoriesSelector],
  (images, categories) => {
    const visibleCategoryImages = images.filter((image: ImageType) => {
      const category = categories.find(
        (c: Category) => c.id === image.categoryId
      );
      return category ? category.visible : true;
    });

    return visibleCategoryImages.filter((image: ImageType) => image.visible);
  }
);
