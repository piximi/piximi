import React, { forwardRef, memo } from "react";
import { Image as KonvaImage } from "react-konva";
import Konva from "konva";

import { Point } from "views/ImageViewer/utils/types";

interface KonvaImageProps {
  image: HTMLImageElement;
  height: number;
  width: number;
  imagePosition: Point;
  activePlane: number;
  filters: any[];
  idx: number;
}

export const MemoizedKonvaImage = memo(
  forwardRef<Konva.Image, KonvaImageProps>((props, ref) => {
    return (
      <KonvaImage
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
  }),
);
