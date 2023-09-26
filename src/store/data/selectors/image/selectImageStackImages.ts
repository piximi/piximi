import { createSelector } from "@reduxjs/toolkit";
import { selectImageEntities } from "./imageSelectors";
import { selectImageStackImageIds } from "store/imageViewer";

export const selectImageStackImages = createSelector(
  [selectImageStackImageIds, selectImageEntities],
  (imageIds, imageEntities) => {
    return imageIds.map((imageId) => imageEntities[imageId]);
  }
);
