import React from "react";
import { useSelector } from "react-redux";
import { Group as KonvaGroup, Line as KonvaLine } from "react-konva";

import { selectImageOrigin } from "views/ImageViewer/state/imageViewer/selectors";

import { PenAnnotationTool } from "views/ImageViewer/utils/tools";

type PenSelectionProps = {
  operator: PenAnnotationTool;
};

export const PenSelection = ({ operator }: PenSelectionProps) => {
  const imageOrigin = useSelector(selectImageOrigin);
  return (
    <>
      <KonvaGroup>
        <KonvaLine
          points={operator.buffer.flatMap((point) => [
            point.x + imageOrigin.x,
            point.y + imageOrigin.y,
          ])}
          lineJoin="round"
          lineCap="round"
          stroke="red"
          strokeWidth={operator.brushSize * 2}
        />
      </KonvaGroup>
    </>
  );
};
