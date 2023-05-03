import { createSelector } from "@reduxjs/toolkit";
import { ImageViewerStore } from "types";

export const selectSelectedAnnotationIds = ({
  imageViewer,
}: {
  imageViewer: ImageViewerStore;
}): string[] => {
  return imageViewer.selectedAnnotationIds;
};

export const selectSelectedAnnotationIdsCount = createSelector(
  selectSelectedAnnotationIds,
  (selectedIds) => {
    return selectedIds.length;
  }
);
