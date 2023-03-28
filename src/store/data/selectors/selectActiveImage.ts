import { createSelector } from "@reduxjs/toolkit";
import { activeImageIdSelector } from "store/annotator";
import { selectImageEntities } from "./selectImageEntities";

export const selectActiveImage = createSelector(
  [activeImageIdSelector, selectImageEntities],
  (activeImageId, imageEntities) => {
    if (!activeImageId) return;
    return imageEntities[activeImageId!];
  }
);
