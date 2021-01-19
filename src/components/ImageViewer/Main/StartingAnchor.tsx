import * as ReactKonva from "react-konva";
import React, { RefObject } from "react";
import { Circle } from "konva/types/shapes/Circle";

type StartingAnchorProps = {
  annotating: boolean;
  position?: { x: number; y: number };
  ref: RefObject<Circle>;
};

export const StartingAnchor = ({
  annotating,
  position,
  ref,
}: StartingAnchorProps) => {
  if (annotating && position) {
    return (
      <ReactKonva.Circle
        fill="#000"
        globalCompositeOperation="source-over"
        hitStrokeWidth={64}
        id="start"
        name="anchor"
        radius={3}
        ref={ref}
        stroke="#FFF"
        strokeWidth={1}
        x={position.x}
        y={position.y}
      />
    );
  } else {
    return <React.Fragment />;
  }
};
