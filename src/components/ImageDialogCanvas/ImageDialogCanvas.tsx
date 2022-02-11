import React from "react";
import { ImageType } from "../../types/ImageType";
import { ImageCanvas } from "./ImageCanvas";
import { LabelCanvas } from "./LabelCanvas";
import { StyledStage } from "./StyledImageCanvasComponents";

type ImageDialogCanvasProps = {
  image: ImageType;
};

export const ImageDialogCanvas = ({ image }: ImageDialogCanvasProps) => {
  return (
    <StyledStage>
      <ImageCanvas image={image} />
      <LabelCanvas image={image} />
    </StyledStage>
  );
};
