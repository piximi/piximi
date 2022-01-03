import React from "react";
import { ToolType } from "../../../../../types/ToolType";
import * as ReactKonva from "react-konva";
import { useSelector } from "react-redux";
import { toolTypeSelector } from "../../../../../store/selectors";
import { penSelectionBrushSizeSelector } from "../../../../../store/selectors/penSelectionBrushSizeSelector";
import { scaledImageWidthSelector } from "../../../../../store/selectors/scaledImageWidthSelector";
import { scaledImageHeightSelector } from "../../../../../store/selectors/scaledImageHeightSelector";

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
