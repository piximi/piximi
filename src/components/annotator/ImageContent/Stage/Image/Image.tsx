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
} from "store/image-viewer";

export const Image = React.forwardRef<Konva.Image>((_, ref) => {
  const activePlane = useSelector(activeImagePlaneSelector);

  const renderedSrcs = useSelector(activeImageRenderedSrcsSelector);

  const width = useSelector(scaledImageWidthSelector);

  const height = useSelector(scaledImageHeightSelector);

  const [filters] = useState<Array<any>>();

  const boundingClientRect = useSelector(boundingClientRectSelector);

  const normalizeFont = 1300;

  const [images, setImages] = useState<Array<HTMLImageElement>>();

  useEffect(() => {
    setImages(
      renderedSrcs.map((src: string) => {
        const imgElem = document.createElement("img");
        imgElem.src = src;
        return imgElem;
      })
    );
  }, [renderedSrcs]);

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
      {images.map((image, idx) => {
        return idx === activePlane ? (
          <ReactKonva.Image
            height={height}
            image={image}
            ref={ref}
            width={width}
            filters={filters}
            visible={true}
            key={idx}
          />
        ) : (
          <ReactKonva.Image
            height={height}
            image={image}
            width={width}
            filters={filters}
            visible={false}
            key={idx}
          />
        );
      })}
    </>
  );
});
