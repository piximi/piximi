import { createSelector } from "@reduxjs/toolkit";
import { selectThingsDictionary } from "store/slices/newData/selectors/selectors";
import { ImageViewer } from "types";

export const selectActiveImageId = ({
  imageViewer,
}: {
  imageViewer: ImageViewer;
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
