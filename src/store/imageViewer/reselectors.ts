import { createSelector } from "@reduxjs/toolkit";
import { selectThingsDictionary } from "store/data/selectors/selectors";
import { selectActiveImageId } from "./selectors/selectActiveImageId";
import { selectImageStackImageIds } from "./selectors/selectImageStackImageIds";
import { generateBlankColors } from "utils/common/tensorHelpers";
import { Colors, ColorsRaw } from "utils/common/types";
import { ImageObject } from "store/data/types";

export const selectActiveImage = createSelector(
  selectActiveImageId,
  selectThingsDictionary,
  (activeImageId, thingDict) => {
    if (!activeImageId) return undefined;
    return thingDict[activeImageId] as ImageObject | undefined;
  }
);

export const selectImageViewerImages = createSelector(
  selectImageStackImageIds,
  selectThingsDictionary,
  (imageStackIds, thingDict) => {
    const imageViewerImages = imageStackIds.reduce(
      (images: ImageObject[], id) => {
        const image = thingDict[id];
        if (image) {
          images.push(image as ImageObject);
        }
        return images;
      },
      []
    );
    return imageViewerImages;
  }
);

export const selectActiveImageRawColor = createSelector(
  selectActiveImage,
  (image): ColorsRaw => {
    let colors: Colors;
    if (!image) {
      colors = generateBlankColors(3);
    } else {
      colors = image.colors;
    }

    return {
      // is sync appropriate? if so we may need to dispose??
      color: colors.color.arraySync() as [number, number, number][],
      range: colors.range,
      visible: colors.visible,
    };
  }
);
