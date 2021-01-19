import * as ReactKonva from "react-konva";
import React, { RefObject } from "react";
import { Category } from "../../../types/Category";
import { toRGBA } from "../../../image/toRGBA";
import { useMarchingAnts } from "../../../hooks";
import { Rect } from "konva/types/shapes/Rect";

type RectangularSelectionProps = {
  activeCategory: Category;
  annotated: boolean;
  annotating: boolean;
  height: number;
  ref: RefObject<Rect>;
  width: number;
  x?: number;
  y?: number;
};

export const RectangularSelection = ({
  activeCategory,
  annotated,
  annotating,
  height,
  ref,
  width,
  x,
  y,
}: RectangularSelectionProps) => {
  const dashOffset = useMarchingAnts();

  if (annotated && !annotating) {
    return (
      <ReactKonva.Rect
        dash={[4, 2]}
        dashOffset={-dashOffset}
        fill={toRGBA(activeCategory.color, 0.3)}
        height={height}
        ref={ref}
        stroke="white"
        strokeWidth={1}
        width={width}
        x={x}
        y={y}
      />
    );
  } else if (!annotated && annotating) {
    return (
      <React.Fragment>
        <ReactKonva.Rect
          height={height}
          stroke="black"
          strokeWidth={1}
          width={width}
          x={x}
          y={y}
        />
        <ReactKonva.Rect
          dash={[4, 2]}
          dashOffset={-dashOffset}
          height={height}
          stroke="white"
          strokeWidth={1}
          width={width}
          x={x}
          y={y}
        />
      </React.Fragment>
    );
  } else {
    return null;
  }
};
