import React, { useRef, useState } from "react";
import { useStyles } from "../ImageDialogCanvas/ImageDialogCanvas.css";
import { Image } from "../../types/Image";

type LabelCanvasProps = {
  image: Image;
};

export const LabelCanvas = ({ image }: LabelCanvasProps) => {
  const classes = useStyles();

  const ref = useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.height = image.shape!.height;
      ref.current.width = image.shape!.width;
    }
  }, [image.shape]);

  return <canvas className={classes.masksCanvas} ref={ref} />;
};
