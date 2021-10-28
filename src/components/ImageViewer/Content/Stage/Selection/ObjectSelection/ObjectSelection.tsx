import { ObjectAnnotationTool } from "../../../../../../annotator/image/Tool";
import * as ReactKonva from "react-konva";
import React from "react";
import { useMarchingAnts } from "../../../../../../annotator/hooks";
import { useSelector } from "react-redux";
import { stageScaleSelector } from "../../../../../../annotator/store/selectors";

type ObjectSelectionProps = {
  operator: ObjectAnnotationTool;
};

export const ObjectSelection = ({ operator }: ObjectSelectionProps) => {
  const dashOffset = useMarchingAnts();

  const stageScale = useSelector(stageScaleSelector);

  if (!operator.origin || !operator.width || !operator.height) return null;

  if (!operator.origin) return null;

  const x = operator.origin.x * stageScale;
  const y = operator.origin.y * stageScale;

  return (
    <ReactKonva.Group>
      <ReactKonva.Rect
        dash={[4 / stageScale, 2 / stageScale]}
        dashOffset={-dashOffset}
        scale={{ x: stageScale, y: stageScale }}
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
        scale={{ x: stageScale, y: stageScale }}
        stroke="white"
        strokeWidth={1 / stageScale}
        width={operator.width}
        x={x}
        y={y}
      />

      <ReactKonva.Line
        scale={{ x: stageScale, y: stageScale }}
        stroke="white"
        points={operator.points}
        strokeWidth={1}
      />
    </ReactKonva.Group>
  );
};
