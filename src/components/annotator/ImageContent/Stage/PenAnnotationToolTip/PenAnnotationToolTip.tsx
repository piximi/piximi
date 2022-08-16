import React from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import {
  penSelectionBrushSizeSelector,
  scaledImageHeightSelector,
  scaledImageWidthSelector,
  toolTypeSelector,
} from "store/image-viewer";

import { ToolType } from "types";

type PenAnnotationToolTipProps = {
  currentPosition?: { x: number; y: number };
  annotating: boolean;
};
export const PenAnnotationToolTip = ({
  annotating,
  currentPosition,
}: PenAnnotationToolTipProps) => {
  const toolType = useSelector(toolTypeSelector);

  const penSelectionBrushSize = useSelector(penSelectionBrushSizeSelector);

  const imageWidth = useSelector(scaledImageWidthSelector);
  const imageHeight = useSelector(scaledImageHeightSelector);

  if (
    toolType !== ToolType.PenAnnotation ||
    annotating ||
    !currentPosition ||
    !imageWidth ||
    !imageHeight
  )
    return <></>;

  if (
    currentPosition.x > imageWidth - penSelectionBrushSize ||
    currentPosition.y > imageHeight - penSelectionBrushSize ||
    currentPosition.x < 0 ||
    currentPosition.y < 0
  )
    return <></>;

  return (
    <>
      <ReactKonva.Ellipse
        radiusX={penSelectionBrushSize}
        radiusY={penSelectionBrushSize}
        x={currentPosition.x}
        y={currentPosition.y}
        stroke="grey"
        strokewidth={1}
        dash={[2, 2]}
      />
    </>
  );
};
