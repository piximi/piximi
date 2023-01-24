import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";
import Konva from "konva";

import {
  activeImagePlaneSelector,
  activeImageRenderedSrcsSelector,
  boundingClientRectSelector,
  scaledImageHeightSelector,
  scaledImageWidthSelector,
  stageHeightSelector,
  stageWidthSelector,
} from "store/annotator";
import { Point } from "types";

export const Image = React.forwardRef<Konva.Image>((_, ref) => {
  const activePlane = useSelector(activeImagePlaneSelector);
  const renderedSrcs = useSelector(activeImageRenderedSrcsSelector);
  const width = useSelector(scaledImageWidthSelector);
  const height = useSelector(scaledImageHeightSelector);
  const [filters] = useState<Array<any>>();
  const boundingClientRect = useSelector(boundingClientRectSelector);
  const normalizeFont = 1300;
  const [images, setImages] = useState<Array<HTMLImageElement>>();
  const stageWidth = useSelector(stageWidthSelector);
  const stageHeight = useSelector(stageHeightSelector);
  const [imagePosition, setImagePosition] = useState<Point>();
  useEffect(() => {
    setImages(
      renderedSrcs.map((src: string) => {
        const imgElem = document.createElement("img");
        imgElem.src = src;
        return imgElem;
      })
    );
  }, [renderedSrcs, width]);

  useEffect(() => {
    setImagePosition({
      x: (stageWidth - width!) / 2,
      y: (stageHeight - height!) / 2,
    });
  }, [stageWidth, stageHeight, width, height]);

  if (!(images && images.length)) {
    return (
      <>
        <ReactKonva.Text
          x={
            boundingClientRect.x +
            (80 * boundingClientRect.width) / normalizeFont
          } //center depending on window width
          y={0.4 * boundingClientRect.height}
          text={
            'To start annotating, drag and drop an image onto the canvas or click on "Open Image".'
          }
          fill={"white"}
          fontSize={(30 * boundingClientRect.width) / normalizeFont} //scale font depending on window width
        />
      </>
    );
  }

  return (
    <>
      {images.map((image, idx) => (
        <ReactKonva.Image
          height={height}
          image={image}
          ref={ref}
          width={width}
          filters={filters}
          visible={idx === activePlane}
          key={idx}
          position={imagePosition}
        />
      ))}
    </>
  );
});
