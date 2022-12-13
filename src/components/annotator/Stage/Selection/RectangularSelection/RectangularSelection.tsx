import React, { useEffect } from "react";
import * as ReactKonva from "react-konva";

import { useImageOrigin, useMarchingAnts } from "hooks";

import { RectangularAnnotationTool } from "annotator-tools";
import { useSelector } from "react-redux";
import { stageScaleSelector } from "store/annotator";

type RectangularSelectionProps = {
  operator: RectangularAnnotationTool;
};

export const RectangularSelection = ({
  operator,
}: RectangularSelectionProps) => {
  const dashOffset = useMarchingAnts();

  const imageOrigin = useImageOrigin();
  const stageScale = useSelector(stageScaleSelector);
  if (!operator.origin || !operator.width || !operator.height) return null;

  const x = operator.origin.x + imageOrigin.x;
  const y = operator.origin.y + imageOrigin.y;

  return (
    <>
      <ReactKonva.Group>
        <ReactKonva.Rect
          dash={[4 / stageScale, 2 / stageScale]}
          dashOffset={-dashOffset}
          height={operator.height}
          stroke="black"
          strokeWidth={1 / stageScale}
          width={operator.width}
          x={x}
          y={y}
        />
        <ReactKonva.Rect
          dash={[4 / stageScale, 2 / stageScale]}
          dashOffset={-dashOffset}
          height={operator.height}
          stroke="white"
          strokeWidth={1 / stageScale}
          width={operator.width}
          x={x}
          y={y}
        />
      </ReactKonva.Group>
    </>
  );
};
