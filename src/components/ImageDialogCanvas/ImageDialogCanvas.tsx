import React from "react";
import { Image } from "../../types/Image";
import { ImageCanvas } from "./ImageCanvas";
import { LabelCanvas } from "./LabelCanvas";
import { StyledStage } from "./StyledImageCanvasComponents";

type ImageDialogCanvasProps = {
  image: Image;
};

export const ImageDialogCanvas = ({ image }: ImageDialogCanvasProps) => {
  return (
    <StyledStage>
      <ImageCanvas image={image} />
      <LabelCanvas image={image} />
    </StyledStage>
  );
};
