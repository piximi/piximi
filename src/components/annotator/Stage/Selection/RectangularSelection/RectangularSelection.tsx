import React from "react";
import * as ReactKonva from "react-konva";

import { useImageOrigin, useMarchingAnts } from "hooks";

import { RectangularAnnotationTool } from "annotator-tools";

type RectangularSelectionProps = {
  operator: RectangularAnnotationTool;
};

export const RectangularSelection = ({
  operator,
}: RectangularSelectionProps) => {
  const dashOffset = useMarchingAnts();

  const imageOrigin = useImageOrigin();

  if (!operator.origin || !operator.width || !operator.height) return null;

  const x = operator.origin.x + imageOrigin.x;
  const y = operator.origin.y + imageOrigin.y;

  return (
    <>
      <ReactKonva.Group>
        <ReactKonva.Rect
          dash={[4, 2]}
          dashOffset={-dashOffset}
          height={operator.height}
          stroke="black"
          strokeWidth={1}
          width={operator.width}
          x={x}
          y={y}
        />
        <ReactKonva.Rect
          dash={[4, 2]}
          dashOffset={-dashOffset}
          height={operator.height}
          stroke="white"
          strokeWidth={1}
          width={operator.width}
          x={x}
          y={y}
        />
      </ReactKonva.Group>
    </>
  );
};
