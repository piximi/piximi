import React, { forwardRef, memo, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";
import Konva from "konva";

import {
  activeImageRenderedSrcsSelector,
  imageOriginSelector,
} from "store/annotator";
import {
  selectActiveImageActivePlane,
  selectActiveImageScaledWidth,
  selectActiveImageScaledHeight,
} from "store/data";

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

export const Image = forwardRef<
  Konva.Image,
  { stageWidth: number; stageHeight: number }
>(({ stageWidth, stageHeight }, ref) => {
  const activePlane = useSelector(selectActiveImageActivePlane)!;
  const renderedSrcs = useSelector(activeImageRenderedSrcsSelector);
  const width = useSelector(selectActiveImageScaledWidth);
  const height = useSelector(selectActiveImageScaledHeight);
  const [filters] = useState<Array<any>>();
  const normalizeFont = 1300;
  const [images, setImages] = useState<Array<HTMLImageElement>>();
  const imagePosition = useSelector(imageOriginSelector);

  useEffect(() => {
    setImages(
      renderedSrcs.map((src: string) => {
        const imgElem = document.createElement("img");
        imgElem.src = src;
        return imgElem;
      })
    );
  }, [renderedSrcs, width]);

  if (!(images && images.length)) {
    return (
      <>
        <ReactKonva.Text
          x={stageWidth / 6} //center depending on window width
          y={0.4 * stageHeight}
          width={(2 * stageWidth) / 3}
          align="center"
          text={
            'To start annotating, drag and drop an image onto the canvas or click on "Open Image".'
          }
          fill={"black"}
          fontSize={(30 * stageWidth) / normalizeFont} //scale font depending on window width
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
