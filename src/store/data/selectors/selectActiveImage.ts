import { createSelector } from "@reduxjs/toolkit";
import { activeImageIdSelector } from "store/imageViewer";
import { selectImageEntities } from "./selectImageEntities";
import { ImageType } from "types";

export const selectActiveImage = createSelector(
  [activeImageIdSelector, selectImageEntities],
  (activeImageId, imageEntities): ImageType | undefined => {
    if (!activeImageId) return;
    return imageEntities[activeImageId!];
  }
);
