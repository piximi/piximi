import { createSelector } from "@reduxjs/toolkit";
import { selectedImagesIdSelector } from "store/project";
import { DataStoreSlice } from "types";
import { selectImageEntities } from "./selectImageEntities";

export const selectAllImages = ({ data }: { data: DataStoreSlice }) => {
  return Object.values(data.images.entities);
};

export const selectSelectedImages = createSelector(
  [selectedImagesIdSelector, selectImageEntities],
  (imageIds, imageEntities) => {
    return imageIds.map((imageId) => imageEntities[imageId]);
  }
);
