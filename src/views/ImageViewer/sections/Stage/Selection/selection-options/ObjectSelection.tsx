import React, { useContext } from "react";
import {
  Group as KonvaGroup,
  Line as KonvaLine,
  Rect as KonvaRect,
} from "react-konva";

import { useMarchingAnts } from "../../../../hooks";

import { StageContext } from "views/ImageViewer/state/StageContext";

import { ObjectAnnotationTool } from "views/ImageViewer/utils/tools";

type ObjectSelectionProps = {
  operator: ObjectAnnotationTool;
};

export const ObjectSelection = ({ operator }: ObjectSelectionProps) => {
  const dashOffset = useMarchingAnts();

  const stageScale = useContext(StageContext)?.current?.scaleX() ?? 1;

  if (!operator.origin || !operator.width || !operator.height) return null;

  if (!operator.origin) return null;

  const x = operator.origin.x * stageScale;
  const y = operator.origin.y * stageScale;

  return (
    <>
      <KonvaGroup>
        <KonvaRect
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
        <KonvaRect
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
        <KonvaLine
          scale={{ x: stageScale, y: stageScale }}
          stroke="white"
          points={operator.points.flatMap((point) => [point.x, point.y])}
          strokeWidth={1}
        />
      </KonvaGroup>
    </>
  );
};
