import React from "react";
import * as ReactKonva from "react-konva";
import { useSelector } from "react-redux";

import { useMarchingAnts } from "hooks";

import { stageScaleSelector } from "store/image-viewer";

import { PolygonalAnnotationTool } from "annotator/AnnotationTools";

type PolygonalSelectionProps = {
  operator: PolygonalAnnotationTool;
};

export const PolygonalSelection = ({ operator }: PolygonalSelectionProps) => {
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
