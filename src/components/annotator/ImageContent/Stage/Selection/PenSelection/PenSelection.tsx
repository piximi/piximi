import React from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { stageScaleSelector } from "store/image-viewer";

import { PenAnnotationTool } from "annotator/AnnotationTools";

type PenSelectionProps = {
  operator: PenAnnotationTool;
};

export const PenSelection = ({ operator }: PenSelectionProps) => {
  const stageScale = useSelector(stageScaleSelector);
  return (
    <>
      <ReactKonva.Group>
        <ReactKonva.Line
          points={operator.buffer.map((point) => [point.x, point.y]).flat()}
          lineJoin="round"
          lineCap="round"
          scale={{ x: stageScale, y: stageScale }}
          stroke="red"
          strokeWidth={operator.brushSize * 2}
        />
      </ReactKonva.Group>
    </>
  );
};
