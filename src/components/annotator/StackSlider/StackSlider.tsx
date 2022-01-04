import { Slider } from "@mui/material";
import React from "react";
import { useSelector } from "react-redux";
import { activeImageIdSelector } from "../../../store/selectors/activeImageIdSelector";
import { annotatorImagesSelector } from "../../../store/selectors/annotatorImagesSelector";
import { Image } from "../../../types/Image";

export const StackSlider = () => {
  const activeImageId = useSelector(activeImageIdSelector);
  const images = useSelector(annotatorImagesSelector);

  const activeImage = images.find((image: Image) => {
    return activeImageId === image.id;
  });
  if (activeImage) {
    console.info(activeImage.shape.planes);
  }

  return <Slider defaultValue={30} aria-label="Disabled slider" />;
};
