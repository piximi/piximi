import { createSelector } from "@reduxjs/toolkit";
import { ImageViewer } from "types";

export const selectSelectedAnnotationIds = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): string[] => {
  return imageViewer.selectedAnnotationIds;
};

export const selectSelectedAnnotationIdsCount = createSelector(
  selectSelectedAnnotationIds,
  (selectedIds) => {
    return selectedIds.length;
  }
);
