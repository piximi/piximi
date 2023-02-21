import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { ListItem, ListItemText } from "@mui/material";

import { createRenderedTensor } from "utils/common/image";

import { annotatorFullImagesSelector } from "store/common";
import { AnnotatorSlice, activeImageColorsSelector } from "store/annotator";

import { ImageType } from "types";

export const ApplyColorsButton = () => {
  const dispatch = useDispatch();

  const activeImageColors = useSelector(activeImageColorsSelector);
  const images = useSelector(annotatorFullImagesSelector);

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

          // TOO: COCO - necessary?
          const imageData = image.data.clone();

          const updatedSrc = await createRenderedTensor(
            imageData,
            imageColors,
            image.bitDepth,
            image.activePlane
          );

          return {
            ...image,
            data: imageData,
            colors: imageColors,
            src: updatedSrc,
          } as ImageType;
        })
      );
    };

    getUpdatedImages().then((updatedImages) => {
      newColor.dispose();
      dispatch(
        AnnotatorSlice.actions.setImages({
          images: updatedImages,
          disposeColorTensors: false,
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
