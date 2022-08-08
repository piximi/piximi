import React from "react";

import { ImageCanvas } from "./ImageCanvas";
import { LabelCanvas } from "./LabelCanvas";
import { StyledStage } from "./StyledImageCanvasComponents";

import { ImageType } from "types";

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
