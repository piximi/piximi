import React, { forwardRef, memo } from "react";
import * as ReactKonva from "react-konva";
import Konva from "konva";

import { Point } from "utils/annotator/types";

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
