import React from "react";
import { ToolType } from "../../../../../annotator/types/ToolType";
import * as ReactKonva from "react-konva";
import { useSelector } from "react-redux";
import { AnnotationTool } from "../../../../../annotator/image/Tool/AnnotationTool/AnnotationTool";
import { toolTypeSelector } from "../../../../../annotator/store/selectors";
import { penSelectionBrushSizeSelector } from "../../../../../annotator/store/selectors/penSelectionBrushSizeSelector";
import { scaledImageWidthSelector } from "../../../../../annotator/store/selectors/scaledImageWidthSelector";
import { scaledImageHeightSelector } from "../../../../../annotator/store/selectors/scaledImageHeightSelector";

type PenAnnotationToolTipProps = {
  currentPosition?: { x: number; y: number };

  annotationTool?: AnnotationTool;
};
export const PenAnnotationToolTip = ({
  annotationTool,
  currentPosition,
}: PenAnnotationToolTipProps) => {
  const toolType = useSelector(toolTypeSelector);

  const penSelectionBrushSize = useSelector(penSelectionBrushSizeSelector);

  const imageWidth = useSelector(scaledImageWidthSelector);
  const imageHeight = useSelector(scaledImageHeightSelector);

  if (
    !currentPosition ||
    !annotationTool ||
    annotationTool.annotating ||
    toolType !== ToolType.PenAnnotation ||
    !imageWidth ||
    !imageHeight
  )
    return <React.Fragment />;

  if (
    currentPosition.x > imageWidth - penSelectionBrushSize ||
    currentPosition.y > imageHeight - penSelectionBrushSize ||
    currentPosition.x < 0 ||
    currentPosition.y < 0
  )
    return <React.Fragment />;

  return (
    <ReactKonva.Ellipse
      radiusX={penSelectionBrushSize}
      radiusY={penSelectionBrushSize}
      x={currentPosition.x}
      y={currentPosition.y}
      stroke="grey"
      strokewidth={1}
      dash={[2, 2]}
    />
  );
};
