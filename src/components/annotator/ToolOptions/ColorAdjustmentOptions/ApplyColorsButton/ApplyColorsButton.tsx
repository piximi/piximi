import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { ListItem, ListItemText } from "@mui/material";

import { createRenderedTensor } from "image/utils/imageHelper";

import { imageViewerFullImagesSelector } from "store/common";
import {
  activeImageColorsSelector,
  imageViewerSlice,
} from "store/image-viewer";

import { ImageType } from "types";

export const ApplyColorsButton = () => {
  const dispatch = useDispatch();

  const activeImageColors = useSelector(activeImageColorsSelector);
  const images = useSelector(imageViewerFullImagesSelector);

  const onApplyColorsClick = async () => {
    const newColor = activeImageColors.color.clone();

    const getUpdatedImages = async () => {
      return Promise.all(
        images.map(async (image) => {
          // if mismatch between num channels, don't do anything to image
          if (image.colors.color.shape[0] !== newColor.shape[0]) {
            return image;
          }

          // dispose its old color
          image.colors.color.dispose();
          const imageColors = {
            ...activeImageColors,
            // give it a copy of its own
            color: newColor.clone(),
          };

          const updatedSrc = await createRenderedTensor(
            image.data,
            imageColors,
            image.bitDepth,
            image.activePlane
          );

          return {
            ...image,
            colors: imageColors,
            src: updatedSrc,
          } as ImageType;
        })
      );
    };

    getUpdatedImages().then((updatedImages) => {
      newColor.dispose();
      dispatch(
        imageViewerSlice.actions.setImages({
          images: updatedImages,
          disposeDataTensors: true,
          disposeColorTensors: true,
        })
      );
    });
  };

  return (
    <ListItem button onClick={onApplyColorsClick}>
      <ListItemText>{"Apply to all images open in annotator"}</ListItemText>
    </ListItem>
  );
};
