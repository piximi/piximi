import React from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { stageScaleSelector } from "store/imageViewer";
import {
  selectPenSelectionBrushSize,
  selectToolType,
} from "store/annotator/selectors";
import {
  selectActiveImageScaledHeight,
  selectActiveImageScaledWidth,
} from "store/data";

import { ToolType } from "types";

type PenAnnotationToolTipProps = {
  currentPosition?: { x: number; y: number };
  absolutePosition?: { x: number; y: number };
  annotating: boolean;
  outOfBounds: boolean;
};
export const PenAnnotationToolTip = ({
  annotating,
  currentPosition,
  absolutePosition,
  outOfBounds,
}: PenAnnotationToolTipProps) => {
  const toolType = useSelector(selectToolType);

  const penSelectionBrushSize = useSelector(selectPenSelectionBrushSize);

  const imageWidth = useSelector(selectActiveImageScaledWidth);
  const imageHeight = useSelector(selectActiveImageScaledHeight);
  const stageScale = useSelector(stageScaleSelector);

  if (
    toolType !== ToolType.PenAnnotation ||
    annotating ||
    !currentPosition ||
    !absolutePosition ||
    !imageWidth ||
    !imageHeight
  )
    return <></>;

  return (
    <>
      <ReactKonva.Ellipse
        radiusX={penSelectionBrushSize / stageScale}
        radiusY={penSelectionBrushSize / stageScale}
        x={currentPosition.x}
        y={currentPosition.y}
        stroke={outOfBounds ? "black" : "white"}
        strokeWidth={2 / stageScale}
        dash={[2 / stageScale, 2 / stageScale]}
      />
    </>
  );
};
