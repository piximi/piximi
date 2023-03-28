import React from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { PenAnnotationTool } from "annotator-tools";
import { imageOriginSelector } from "store/imageViewer";

type PenSelectionProps = {
  operator: PenAnnotationTool;
};

export const PenSelection = ({ operator }: PenSelectionProps) => {
  const imageOrigin = useSelector(imageOriginSelector);
  return (
    <>
      <ReactKonva.Group>
        <ReactKonva.Line
          points={operator.buffer.flatMap((point) => [
            point.x + imageOrigin.x,
            point.y + imageOrigin.y,
          ])}
          lineJoin="round"
          lineCap="round"
          stroke="red"
          strokeWidth={operator.brushSize * 2}
        />
      </ReactKonva.Group>
    </>
  );
};
