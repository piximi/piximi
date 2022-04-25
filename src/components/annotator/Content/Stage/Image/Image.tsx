import * as ReactKonva from "react-konva";
import React, { useEffect, useState } from "react";
import Konva from "konva";
import { useSelector } from "react-redux";
import { boundingClientRectSelector } from "../../../../../store/selectors";
import { scaledImageWidthSelector } from "../../../../../store/selectors/scaledImageWidthSelector";
import { scaledImageHeightSelector } from "../../../../../store/selectors/scaledImageHeightSelector";
import { activeImageRenderedSrcsSelector } from "../../../../../store/selectors";
import { activeImagePlaneSelector } from "store/selectors/activeImagePlaneSelector";

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
        return (
          <ReactKonva.Image
            height={height}
            image={image}
            ref={ref}
            width={width}
            filters={filters}
            visible={idx === activePlane}
            key={idx}
          />
        );
      })}
    </>
  );
});
