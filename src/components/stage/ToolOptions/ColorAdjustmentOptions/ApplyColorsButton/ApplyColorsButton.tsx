import React from "react";
import { useSelector } from "react-redux";

import { CustomListItemButton } from "components/list-items/CustomListItemButton";
import { createRenderedTensor } from "utils/common/image";

import { selectActiveImageColor, selectSelectedImages } from "store/data";

export const ApplyColorsButton = () => {
  const activeImageColors = useSelector(selectActiveImageColor);
  const images = useSelector(selectSelectedImages);

  const handleApplyColorsClick = async () => {
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

          // TODO: COCO - necessary?
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
          };
        })
      );
    };

    getUpdatedImages().then((updatedImages) => {
      newColor.dispose();
    });
  };

  return (
    <CustomListItemButton
      primaryText="Apply to all images open in annotator"
      onClick={handleApplyColorsClick}
    />
  );
};
