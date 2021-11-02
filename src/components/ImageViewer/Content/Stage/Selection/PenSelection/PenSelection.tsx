import * as ReactKonva from "react-konva";
import React from "react";
import { PenAnnotationTool } from "../../../../../../annotator/image/Tool";
import { useSelector } from "react-redux";
import { stageScaleSelector } from "../../../../../../store/selectors";

type PenSelectionProps = {
  operator: PenAnnotationTool;
};

export const PenSelection = ({ operator }: PenSelectionProps) => {
  const stageScale = useSelector(stageScaleSelector);
  return (
    <>
      {/*// @ts-ignore */}
      <ReactKonva.Group>
        {/*// @ts-ignore */}
        <ReactKonva.Line
          points={operator.buffer}
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
