import React, { forwardRef, memo, useState } from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";
import Konva from "konva";

import { imageOriginSelector } from "store/imageViewer";
import {
  selectActiveImageActivePlane,
  selectActiveImageWidth,
  selectActiveImageHeight,
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
  { stageWidth: number; stageHeight: number; images: HTMLImageElement[] }
>(({ stageWidth, stageHeight, images }, ref) => {
  const activePlane = useSelector(selectActiveImageActivePlane)!;
  const width = useSelector(selectActiveImageWidth);
  const height = useSelector(selectActiveImageHeight);
  const [filters] = useState<Array<any>>();
  const imagePosition = useSelector(imageOriginSelector);
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
