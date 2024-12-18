import React, { useContext } from "react";
import { useSelector } from "react-redux";
import { Ellipse as KonvaEllipse } from "react-konva";

import { StageContext } from "views/ImageViewer/state/StageContext";
import {
  selectPenSelectionBrushSize,
  selectToolType,
} from "views/ImageViewer/state/annotator/selectors";
import { selectActiveImage } from "views/ImageViewer/state/imageViewer/reselectors";

import { ToolType } from "views/ImageViewer/utils/enums";

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

  const activeImage = useSelector(selectActiveImage);
  const stageScale = useContext(StageContext)?.current?.scaleX() ?? 1;

  if (
    toolType !== ToolType.PenAnnotation ||
    annotating ||
    !currentPosition ||
    !absolutePosition ||
    !activeImage
  )
    return <></>;

  return (
    <>
      <KonvaEllipse
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
