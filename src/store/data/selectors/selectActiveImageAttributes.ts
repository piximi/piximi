import { createSelector } from "@reduxjs/toolkit";
import { activeImageIdSelector, stageScaleSelector } from "store/imageViewer";
import { selectImageEntities } from "./selectImageEntities";
import { Colors, ColorsRaw } from "types/tensorflow";
import { generateBlankColors } from "utils/common/image";
import { selectStagedImageEntities } from "./selectStagedImageEntities";
import { selectActiveImage } from "./selectActiveImage";

export const selectActiveImageBitDepth = createSelector(
  [activeImageIdSelector, selectImageEntities],
  (activeImageId, imageEntities) => {
    if (!activeImageId) return;
    return imageEntities[activeImageId!].bitDepth;
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
  [activeImageIdSelector, selectImageEntities],
  (activeImageId, imageEntities) => {
    if (!activeImageId) return;
    return imageEntities[activeImageId!].data;
  }
);

export const selectActiveImageName = createSelector(
  [activeImageIdSelector, selectImageEntities],
  (activeImageId, imageEntities) => {
    if (!activeImageId) return;
    return imageEntities[activeImageId].name;
  }
);
export const selectActiveImageActivePlane = createSelector(
  [activeImageIdSelector, selectImageEntities, selectStagedImageEntities],
  (activeImageId, imageEntities, stagedImageEntities) => {
    if (!activeImageId) return;
    if (
      stagedImageEntities[activeImageId] &&
      stagedImageEntities[activeImageId]?.activePlane
    ) {
      return stagedImageEntities[activeImageId]!.activePlane;
    }
    return imageEntities[activeImageId].activePlane;
  }
);

export const selectActiveImageShape = createSelector(
  [activeImageIdSelector, selectImageEntities],
  (activeImageId, imageEntities) => {
    if (!activeImageId) return;
    return imageEntities[activeImageId].shape;
  }
);

export const selectActiveImageHeight = createSelector(
  [activeImageIdSelector, selectImageEntities],
  (activeImageId, imageEntities) => {
    if (!activeImageId) return;
    return imageEntities[activeImageId].shape.height;
  }
);

export const selectActiveImageWidth = createSelector(
  [activeImageIdSelector, selectImageEntities],
  (activeImageId, imageEntities) => {
    if (!activeImageId) return;
    return imageEntities[activeImageId].shape.width;
  }
);

export const selectActiveImageChannels = createSelector(
  [activeImageIdSelector, selectImageEntities],
  (activeImageId, imageEntities) => {
    if (!activeImageId) return;
    return imageEntities[activeImageId].shape.channels;
  }
);

export const selectActiveImageSrc = createSelector(
  [activeImageIdSelector, selectImageEntities],
  (activeImageId, imageEntities) => {
    if (!activeImageId) return;
    return imageEntities[activeImageId].src;
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
