import React from "react";
import { useSelector } from "react-redux";

import { ListItem, ListItemText } from "@mui/material";

import { createRenderedTensor } from "utils/common/image";

import { selectActiveImageColor, selectSelectedImages } from "store/data";

import { OldImageType } from "types";

export const ApplyColorsButton = () => {
  const activeImageColors = useSelector(selectActiveImageColor);
  const images = useSelector(selectSelectedImages);

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
          } as OldImageType;
        })
      );
    };

    getUpdatedImages().then((updatedImages) => {
      newColor.dispose();
    });
  };

  return (
    <ListItem button onClick={onApplyColorsClick}>
      <ListItemText>{"Apply to all images open in annotator"}</ListItemText>
    </ListItem>
  );
};
