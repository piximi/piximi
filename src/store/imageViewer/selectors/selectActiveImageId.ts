import { createSelector } from "@reduxjs/toolkit";
import { selectThingsDictionary } from "store/data/selectors/selectors";
import { ImageViewerState } from "store/types";

export const selectActiveImageId = ({
  imageViewer,
}: {
  imageViewer: ImageViewerState;
}): string | undefined => {
  return imageViewer.activeImageId;
};

export const selectActiveImage = createSelector(
  selectActiveImageId,
  selectThingsDictionary,
  (activeImageId, thingsdict) => {
    if (!activeImageId) return;
    return thingsdict[activeImageId];
  }
);
