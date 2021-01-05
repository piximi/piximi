import React from "react";
import { Image } from "../../../types/Image";
import { useStyles } from "./RectangularSelection.css";

type ImageViewerProps = {
  data: Image;
};

export const RectangularSelection = ({ data }: ImageViewerProps) => {
  const classes = useStyles();

  return <div />;
};
