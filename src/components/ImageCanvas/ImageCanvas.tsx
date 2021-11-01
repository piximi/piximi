import React, { useRef } from "react";
import { useStyles } from "../ImageDialogCanvas/ImageDialogCanvas.css";
import { Image as ImageType } from "../../types/Image";

type ImageCanvasProps = {
  image: ImageType;
};

export const ImageCanvas = ({ image }: ImageCanvasProps) => {
  const classes = useStyles();

  const ref = useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.height = image.shape!.height;
      ref.current.width = image.shape!.width;

      const context = ref.current.getContext("2d");
      const background = new Image();
      background.src = image.originalSrc;
      background.onload = () => {
        if (context) {
          context.drawImage(background, 0, 0);
        }
      };
    }
  }, [image.originalSrc]);

  return <canvas className={classes.backgroundCanvas} ref={ref} />;
};
