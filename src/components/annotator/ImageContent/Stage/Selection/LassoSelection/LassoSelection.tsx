import React from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { useMarchingAnts } from "hooks";

import { stageScaleSelector } from "store/annotator";

import { LassoAnnotationTool } from "annotator-tools";

type LassoSelectionProps = {
  operator: LassoAnnotationTool;
};

export const LassoSelection = ({ operator }: LassoSelectionProps) => {
  const dashOffset = useMarchingAnts();

  const stageScale = useSelector(stageScaleSelector);

  if (!operator.origin) return <></>;

  return (
    <>
      <ReactKonva.Group>
        <ReactKonva.Circle
          fill="white"
          radius={3}
          stroke="black"
          strokeWidth={1}
          x={operator.origin.x * stageScale}
          y={operator.origin.y * stageScale}
        />

        {operator.anchor && (
          <>
            <ReactKonva.Circle
              fill="black"
              radius={3}
              stroke="white"
              strokeWidth={1}
              x={operator.anchor.x * stageScale}
              y={operator.anchor.y * stageScale}
            />
          </>
        )}
        <ReactKonva.Line
          points={operator.buffer.flatMap((point) => [point.x, point.y])}
          scale={{ x: stageScale, y: stageScale }}
          stroke="black"
          strokeWidth={1 / stageScale}
        />
        <ReactKonva.Line
          dash={[4 / stageScale, 2 / stageScale]}
          dashOffset={-dashOffset}
          scale={{ x: stageScale, y: stageScale }}
          stroke="white"
          points={operator.buffer.flatMap((point) => [point.x, point.y])}
          strokeWidth={1 / stageScale}
        />
      </ReactKonva.Group>
    </>
  );
};
