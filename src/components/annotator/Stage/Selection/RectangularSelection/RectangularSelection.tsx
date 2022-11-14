import React from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { useMarchingAnts } from "hooks";

import { stageScaleSelector } from "store/annotator";

import { RectangularAnnotationTool } from "annotator-tools";

type RectangularSelectionProps = {
  operator: RectangularAnnotationTool;
};

export const RectangularSelection = ({
  operator,
}: RectangularSelectionProps) => {
  const dashOffset = useMarchingAnts();

  const stageScale = useSelector(stageScaleSelector);

  if (!operator.origin || !operator.width || !operator.height) return null;

  const x = operator.origin.x * stageScale;
  const y = operator.origin.y * stageScale;

  return (
    <>
      <ReactKonva.Group>
        <ReactKonva.Rect
          dash={[4 / stageScale, 2 / stageScale]}
          dashOffset={-dashOffset}
          height={operator.height}
          scale={{ x: stageScale, y: stageScale }}
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
          scale={{ x: stageScale, y: stageScale }}
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
