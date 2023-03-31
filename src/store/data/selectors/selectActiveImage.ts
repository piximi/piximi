import { createSelector } from "@reduxjs/toolkit";
import { activeImageIdSelector } from "store/imageViewer";
import { selectImageViewerImageEntities } from "./imageSelectors";
import { ImageType } from "types";

export const selectActiveImage = createSelector(
  [activeImageIdSelector, selectImageViewerImageEntities],
  (activeImageId, imageEntities): ImageType | undefined => {
    if (!activeImageId) return;
    return imageEntities[activeImageId] ?? undefined;
  }
);
