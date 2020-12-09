import React, { useEffect, useRef } from "react";
import { Image } from "../../types/Image";
import { fabric } from "fabric";

type AnnotatorCanvasProps = {
  image: Image;
};

export const AnnotatorCanvas = ({ image }: AnnotatorCanvasProps) => {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = new fabric.Canvas("annotator", {
      height: image.shape?.r,
      width: image.shape?.c,
    });

    fabric.Image.fromURL(image.src, (img) => canvas.add(img));
  }, [image]);

  return <canvas id="annotator" ref={ref} />;
};
