import { createSelector } from "@reduxjs/toolkit";
import { selectThingsDictionary } from "store/slices/newData/selectors/selectors";
import { NewImageType } from "types/ImageType";
import { selectActiveImageId } from "./selectors/selectActiveImageId";
import { selectImageStackImageIds } from "./selectors/selectImageStackImageIds";

export const selectActiveImage = createSelector(
  selectActiveImageId,
  selectThingsDictionary,
  (activeImageId, thingDict) => {
    if (!activeImageId) return undefined;
    return thingDict[activeImageId] as NewImageType | undefined;
  }
);

export const selectImageViewerImages = createSelector(
  selectImageStackImageIds,
  selectThingsDictionary,
  (imageStackIds, thingDict) => {
    const imageViewerImages = imageStackIds.reduce(
      (images: NewImageType[], id) => {
        const image = thingDict[id];
        if (image) {
          images.push(image as NewImageType);
        }
        return images;
      },
      []
    );
    return imageViewerImages;
  }
);
