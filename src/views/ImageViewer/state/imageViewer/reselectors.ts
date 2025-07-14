import { createSelector } from "@reduxjs/toolkit";
import { selectActiveImageId, selectImageStackImageIds } from "./selectors";
import { selectImageDictionary } from "store/data/selectors";
import { getFullTimepointImage } from "store/data/utils";
import { generateBlankColors } from "utils/tensorUtils";
import { Colors, ColorsRaw } from "utils/types";
import { TSImageObject } from "store/data/types";

export const selectUpdatedImages = createSelector(
  selectImageStackImageIds,
  selectImageDictionary,
  (imageSeriesDetails, images): Record<string, TSImageObject> => {
    const updatedImages: Record<string, TSImageObject> = {};

    for (const imageId of Object.keys(imageSeriesDetails)) {
      const image = images[imageId];

      const finalImage = {
        id: image.id,
        shape: image.shape,
        bitDepth: image.bitDepth,
        kind: image.kind,
        containing: image.containing,
        partition: image.partition,
        name: image.name,
        timepoints: {},
      } as TSImageObject;

      Object.keys(imageSeriesDetails[imageId].timepoints).forEach((tp) => {
        finalImage.timepoints[tp] = {
          ...image.timepoints[tp],
          colors: imageSeriesDetails[imageId].timepoints[tp].ZTColors,
        };
      });
      updatedImages[imageId] = finalImage;
    }

    return updatedImages;
  },
);

export const selectImageSeriesArray = createSelector(
  selectUpdatedImages,
  (images) => Object.values(images),
);

export const selectActiveImage = createSelector(
  selectImageStackImageIds,
  selectActiveImageId,
  selectUpdatedImages,
  (imageDetails, activeImageId, images) => {
    return activeImageId
      ? getFullTimepointImage(
          images[activeImageId],
          imageDetails[activeImageId].activeTimepoint,
        )
      : undefined;
  },
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
  },
);

export const selectActiveImageObjectIds = createSelector(
  selectActiveImage,
  (activeImage) => activeImage?.containing ?? [],
);
