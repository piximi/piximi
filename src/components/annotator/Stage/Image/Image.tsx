import React, { forwardRef, memo, useEffect, useState } from "react";
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

interface KonvaImageProps {
  image: HTMLImageElement;
  height: number;
  width: number;
  imagePosition: Point;
  activePlane: number;
  filters: any[];
  idx: number;
}

const MemoizedKonvaImage = memo(
  forwardRef<Konva.Image, KonvaImageProps>((props, ref) => {
    return (
      <ReactKonva.Image
        height={props.height}
        image={props.image}
        ref={ref}
        width={props.width}
        filters={props.filters}
        visible={props.idx === props.activePlane}
        position={props.imagePosition}
        key={props.idx}
      />
    );
  })
);

export const Image = forwardRef<Konva.Image>((_, ref) => {
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
        <MemoizedKonvaImage
          image={image}
          height={height!}
          width={width!}
          imagePosition={imagePosition!}
          activePlane={activePlane}
          filters={filters!}
          idx={idx}
          key={idx}
          ref={ref}
        />
      ))}
    </>
  );
});
