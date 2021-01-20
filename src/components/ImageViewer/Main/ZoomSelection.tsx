import * as ReactKonva from "react-konva";
import React from "react";
import { useMarchingAnts } from "../../../hooks";

type ZoomSelectionProps = {
  selected: boolean;
  selecting: boolean;
  height: number;
  width: number;
  x?: number;
  y?: number;
};

export const ZoomSelection = ({
  selected,
  selecting,
  height,
  width,
  x,
  y,
}: ZoomSelectionProps) => {
  const dashOffset = useMarchingAnts();

  if (!selected && selecting) {
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
