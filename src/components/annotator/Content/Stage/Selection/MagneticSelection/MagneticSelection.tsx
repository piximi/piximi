import React from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { useMarchingAnts } from "hooks";

import { stageScaleSelector } from "store/selectors";

import { MagneticAnnotationTool } from "annotator/image/Tool";

type MagneticSelectionProps = {
  operator: MagneticAnnotationTool;
};

export const MagneticSelection = ({ operator }: MagneticSelectionProps) => {
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
          points={operator.buffer}
          scale={{ x: stageScale, y: stageScale }}
          stroke="black"
          strokeWidth={1 / stageScale}
        />
        <ReactKonva.Line
          dash={[4 / stageScale, 2 / stageScale]}
          scale={{ x: stageScale, y: stageScale }}
          dashOffset={-dashOffset}
          stroke="white"
          points={operator.buffer}
          strokeWidth={1 / stageScale}
        />
      </ReactKonva.Group>
    </>
  );
};
