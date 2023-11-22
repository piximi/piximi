import React, { useContext } from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { StageContext } from "views/ImageViewer/ImageViewer";

import {
  selectPenSelectionBrushSize,
  selectToolType,
} from "store/slices/annotator/selectors";
import {
  selectActiveImageHeight,
  selectActiveImageWidth,
} from "store/slices/data";

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

  const imageWidth = useSelector(selectActiveImageWidth);
  const imageHeight = useSelector(selectActiveImageHeight);
  const stageScale = useContext(StageContext)?.current?.scaleX() ?? 1;

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
