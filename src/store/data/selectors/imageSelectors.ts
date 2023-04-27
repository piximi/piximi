import { createSelector } from "@reduxjs/toolkit";
import { selectedImagesIdSelector } from "store/project";
import { DataStoreSlice, ImageType, Partition } from "types";

import { selectVisibleCategoryIds } from "./imageCategorySelectors";
import { imagesAdapter } from "../dataSlice";
import { RootState } from "store/reducer/reducer";
import { selectAnnotationsByImageDict } from "./annotationSelectors";

const imageSelectors = imagesAdapter.getSelectors(
  (state: RootState) => state.data.images
);

export const selectImageIds = imageSelectors.selectIds;
export const selectImageEntities = imageSelectors.selectEntities;
export const selectAllImages = imageSelectors.selectAll;
export const selectImageById = imageSelectors.selectById;

export const selectImageCount = createSelector(selectAllImages, (images) => {
  return images.length;
});

export const selectImagesByCategoryDict = ({
  data,
}: {
  data: DataStoreSlice;
}) => {
  return data.imagesByCategory;
};

export const selectImagesByCategory = createSelector(
  [selectImagesByCategoryDict, (_, categoryId) => categoryId],
  (imagesByCategory, categoryId) => {
    return imagesByCategory[categoryId];
  }
);
export const selectImageCountByCategory = () =>
  createSelector(
    [selectImagesByCategoryDict, (_, categoryId) => categoryId],
    (imagesByCategory, categoryId) => {
      return imagesByCategory[categoryId]?.length ?? 0;
    }
  );

export const selectImagesByPartition = createSelector(
  [selectAllImages, (_, partition: Partition) => partition],
  (images, partition) => {
    return images.filter((image) => image.partition === partition);
  }
);

export const selectSelectedImages = createSelector(
  [selectedImagesIdSelector, selectImageEntities],
  (imageIds, imageEntities) => {
    return imageIds.map((imageId) => imageEntities[imageId]);
  }
);

export const selectVisibleImages = createSelector(
  [selectVisibleCategoryIds, selectImagesByCategoryDict, selectImageEntities],
  (visibleCategories, imagesByCategory, imageEntities) => {
    const visibleImages: ImageType[] = [];
    for (const categoryId of visibleCategories) {
      for (const imageId of imagesByCategory[categoryId]) {
        if (imageEntities[imageId].visible) {
          visibleImages.push(imageEntities[imageId]);
        }
      }
    }
    return visibleImages;
  }
);

export const selectUnannotatedImages = createSelector(
  [selectAnnotationsByImageDict, selectImageEntities],
  (annotationsByImage, imageEntities) => {
    const images = [];
    for (const imageId in annotationsByImage) {
      if (!annotationsByImage[imageId].length) {
        images.push(imageEntities[imageId]);
      }
    }

    return images;
  }
);
export const selectAnnotatedImages = createSelector(
  [selectAnnotationsByImageDict, selectImageEntities],
  (annotationsByImage, imageEntities) => {
    const images = [];
    for (const imageId in annotationsByImage) {
      if (annotationsByImage[imageId].length) {
        images.push(imageEntities[imageId]);
      }
    }

    return images;
  }
);
