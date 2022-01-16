import React, { useRef } from "react";
import { Image as ImageType } from "../../types/Image";
import { StyleBackgroundCanvas } from "./StyledImageCanvasComponents";

type ImageCanvasProps = {
  image: ImageType;
};

export const ImageCanvas = ({ image }: ImageCanvasProps) => {
  const ref = useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.height = image.shape!.height;
      ref.current.width = image.shape!.width;

      const context = ref.current.getContext("2d");
      const background = new Image();
      background.src = image.src;
      background.onload = () => {
        if (context) {
          context.drawImage(background, 0, 0);
        }
      };
    }
  }, [image.src]);

  return <StyleBackgroundCanvas ref={ref} />;
};
