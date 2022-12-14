import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import {
  penSelectionBrushSizeSelector,
  scaledImageHeightSelector,
  scaledImageWidthSelector,
  stageScaleSelector,
  toolTypeSelector,
} from "store/annotator";

import { ToolType } from "types";

type PenAnnotationToolTipProps = {
  currentPosition?: { x: number; y: number };
  absolutePosition?: { x: number; y: number };
  annotating: boolean;
};
export const PenAnnotationToolTip = ({
  annotating,
  currentPosition,
  absolutePosition,
}: PenAnnotationToolTipProps) => {
  const toolType = useSelector(toolTypeSelector);

  const penSelectionBrushSize = useSelector(penSelectionBrushSizeSelector);

  const imageWidth = useSelector(scaledImageWidthSelector);
  const imageHeight = useSelector(scaledImageHeightSelector);
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

  if (
    absolutePosition.x >= imageWidth ||
    absolutePosition.y >= imageHeight ||
    absolutePosition.x <= 0 ||
    absolutePosition.y <= 0
  )
    return <></>;

  return (
    <>
      <ReactKonva.Ellipse
        radiusX={penSelectionBrushSize / stageScale}
        radiusY={penSelectionBrushSize / stageScale}
        x={currentPosition.x}
        y={currentPosition.y}
        stroke="grey"
        strokeWidth={2 / stageScale}
        dash={[2 / stageScale, 2 / stageScale]}
      />
    </>
  );
};
