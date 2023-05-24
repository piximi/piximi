import { createSelector } from "@reduxjs/toolkit";
import { selectedImagesIdSelector } from "store/project";
import { selectImageEntities } from "./imageSelectors";

export const selectSelectedImages = createSelector(
  [selectedImagesIdSelector, selectImageEntities],
  (imageIds, imageEntities) => {
    return imageIds.map((imageId) => imageEntities[imageId]);
  }
);
