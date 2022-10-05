import React from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { useMarchingAnts } from "hooks";

import { stageScaleSelector } from "store/image-viewer";

import { ObjectAnnotationTool } from "annotator/AnnotationTools";

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
    <>
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
          points={operator.points.map((point) => [point.x, point.y]).flat()}
          strokeWidth={1}
        />
      </ReactKonva.Group>
    </>
  );
};
