import { createSelector } from "@reduxjs/toolkit";
import { ImageViewer } from "types";

export const selectActiveAnnotationIds = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
}): string[] => {
  return imageViewer.activeAnnotationIds;
};

export const selectActiveAnnotationIdsCount = createSelector(
  selectActiveAnnotationIds,
  (activeIds): number => {
    return activeIds.length;
  }
);
