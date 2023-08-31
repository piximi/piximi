import { createSelector } from "@reduxjs/toolkit";
import { selectSelectedImagesId } from "store/project";
import { selectImageEntities } from "./imageSelectors";

export const selectSelectedImages = createSelector(
  [selectSelectedImagesId, selectImageEntities],
  (imageIds, imageEntities) => {
    return imageIds.map((imageId) => imageEntities[imageId]);
  }
);
