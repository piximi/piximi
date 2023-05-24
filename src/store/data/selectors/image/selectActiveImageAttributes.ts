import { createSelector } from "@reduxjs/toolkit";

import { getProperty } from "store/entities/utils";
import { stageScaleSelector } from "store/imageViewer";
import { selectActiveImage } from "./selectActiveImage";

import { ImageAttributeType, ImageType, Colors, ColorsRaw } from "types";

import { generateBlankColors } from "utils/common/image";

//TODO: get this to work
export const selectActiveImageAttributes = createSelector(
  [
    selectActiveImage,
    <S extends ImageAttributeType>(state: any, attrs: Array<S>) => attrs,
  ],
  <S extends ImageAttributeType>(
    activeImage: ImageType | undefined,
    attrs: S[]
  ) => {
    console.log("Ive been ran");
    if (!activeImage) return;
    const attrObj: Partial<ImageType> = {};
    for (const attr of attrs) {
      attrObj[attr] = getProperty(activeImage, attr) as ImageType[S];
    }
    return attrObj;
  }
);
export const selectActiveImageBitDepth = createSelector(
  [selectActiveImage],
  (activeImage) => {
    if (!activeImage) return;
    return activeImage.bitDepth;
  }
);

export const selectActiveImageRawColor = createSelector(
  [selectActiveImage],
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

export const selectActiveImageColor = createSelector(
  [selectActiveImage],
  (image): Colors => {
    if (!image) {
      return generateBlankColors(3);
    }

    return image.colors;
  }
);

export const selectActiveImageData = createSelector(
  [selectActiveImage],
  (activeImage) => {
    if (!activeImage) return;
    return activeImage.data;
  }
);

export const selectActiveImageName = createSelector(
  [selectActiveImage],
  (activeImage) => {
    if (!activeImage) return;
    return activeImage.name;
  }
);
export const selectActiveImageActivePlane = createSelector(
  [selectActiveImage],
  (activeImage) => {
    if (!activeImage) return;

    return activeImage.activePlane;
  }
);

export const selectActiveImageShape = createSelector(
  [selectActiveImage],
  (activeImage) => {
    if (!activeImage) return;
    return activeImage.shape;
  }
);

export const selectActiveImageHeight = createSelector(
  [selectActiveImage],
  (activeImage) => {
    if (!activeImage) return;
    return activeImage.shape.height;
  }
);

export const selectActiveImageWidth = createSelector(
  [selectActiveImage],
  (activeImage) => {
    if (!activeImage) return;
    return activeImage.shape.width;
  }
);

export const selectActiveImageChannels = createSelector(
  [selectActiveImage],
  (activeImage) => {
    if (!activeImage) return;
    return activeImage.shape.channels;
  }
);

export const selectActiveImageSrc = createSelector(
  [selectActiveImage],
  (activeImage) => {
    if (!activeImage) return;
    return activeImage.src;
  }
);

export const selectActiveImageScaledWidth = createSelector(
  [stageScaleSelector, selectActiveImageWidth],
  (scale, imageWidth) => {
    if (!imageWidth) return;
    return scale * imageWidth;
  }
);
export const selectActiveImageScaledHeight = createSelector(
  [stageScaleSelector, selectActiveImageHeight],
  (scale, imageHeight) => {
    if (!imageHeight) return;
    return scale * imageHeight;
  }
);
