import { createSelector } from "@reduxjs/toolkit";

import { RootState } from "store/rootReducer";

import { imagesAdapter } from "../../dataSlice";
import { selectAnnotationsByImageDict } from "../annotation/annotationSelectors";

import { Data, ImageType, Partition, UNKNOWN_IMAGE_CATEGORY_ID } from "types";

const imageSelectors = imagesAdapter.getSelectors(
  (state: RootState) => state.data.images
);

export const selectImageIds = imageSelectors.selectIds;
export const selectImageEntities = imageSelectors.selectEntities;
export const selectAllImages = imageSelectors.selectAll;
export const selectImageById = createSelector(
  selectImageEntities,
  (imageEntities): ((imageId: string) => ImageType) => {
    return (imageId: string) => imageEntities[imageId];
  }
);

export const selectImageCount = createSelector(selectAllImages, (images) => {
  return images.length;
});

export const selectImagesByCategoryDict = ({ data }: { data: Data }) => {
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

export const selectCategorizedImages = createSelector(
  selectAllImages,
  (images) => {
    return images.filter(
      (image) => image.categoryId !== UNKNOWN_IMAGE_CATEGORY_ID
    );
  }
);
