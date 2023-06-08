import { createSelector } from "@reduxjs/toolkit";

import { RootState } from "store/reducer/reducer";

import { imagesAdapter } from "../../dataSlice";
import { selectAnnotationsByImageDict } from "../annotation/annotationSelectors";

import { DataStoreSlice, Partition } from "types";

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

export const selectImagesByPartitions = createSelector(
  [selectAllImages],
  (images) => (partitions: Partition[]) => {
    return images.filter((image) => partitions.includes(image.partition));
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
