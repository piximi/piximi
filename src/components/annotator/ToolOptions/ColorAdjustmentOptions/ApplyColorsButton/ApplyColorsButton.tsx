import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { ListItem, ListItemText } from "@mui/material";

import { imageViewerFullImagesSelector } from "store/common";
import {
  activeImageColorsSelector,
  activeImagePlaneSelector,
  imageViewerSlice,
} from "store/image-viewer";

import { ImageType } from "types";

import {
  convertImageURIsToImageData,
  mapChannelsToSpecifiedRGBImage,
} from "utils/common/imageHelper";

export const ApplyColorsButton = () => {
  const activeImageColors = useSelector(activeImageColorsSelector);
  const dispatch = useDispatch();
  const images = useSelector(imageViewerFullImagesSelector);
  const activeImagePlane = useSelector(activeImagePlaneSelector);

  const onApplyColorsClick = () => {
    dispatch(
      imageViewerSlice.actions.setCurrentColors({
        currentColors: activeImageColors,
      })
    );

    const getUpdatedImages = async (): Promise<Array<ImageType>> => {
      return Promise.all(
        images.map(async (image: ImageType) => {
          if (image.shape.channels !== activeImageColors.length) {
            //if mismatch between image size and desired colors, don't do anything on the image
            return image;
          }

          const activePlaneData = (
            await convertImageURIsToImageData(
              new Array(image.originalSrc[activeImagePlane])
            )
          )[0];

          const modifiedURI = mapChannelsToSpecifiedRGBImage(
            activePlaneData,
            activeImageColors,
            image.shape.height,
            image.shape.width
          );

          return { ...image, colors: activeImageColors, src: modifiedURI };
        })
      );
    };

    getUpdatedImages().then((updatedImages: Array<ImageType>) => {
      dispatch(imageViewerSlice.actions.setImages({ images: updatedImages }));
    });
  };

  return (
    <ListItem button onClick={onApplyColorsClick}>
      <ListItemText>{"Apply to all images open in annotator"}</ListItemText>
    </ListItem>
  );
};
