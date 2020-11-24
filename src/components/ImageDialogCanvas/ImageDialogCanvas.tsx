import React from "react";
import { useStyles } from "./ImageDialogCanvas.css";
import { Image } from "../../types/Image";
import { ImageCanvas } from "../ImageCanvas";
import { LabelCanvas } from "../LabelCanvas";
import { NewInstanceCanvas } from "../NewInstanceCanvas";

type ImageDialogCanvasProps = {
  image: Image;
};

export const ImageDialogCanvas = ({ image }: ImageDialogCanvasProps) => {
  const classes = useStyles();

  return (
    <div className={classes.stage}>
      <ImageCanvas image={image} />
      <LabelCanvas image={image} />
      <NewInstanceCanvas image={image} />
    </div>
  );
};
