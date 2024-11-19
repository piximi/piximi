import React from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { selectImageOrigin } from "store/imageViewer/selectors";

import { PenAnnotationTool } from "utils/annotator/tools";

type PenSelectionProps = {
  operator: PenAnnotationTool;
};

export const PenSelection = ({ operator }: PenSelectionProps) => {
  const imageOrigin = useSelector(selectImageOrigin);
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
