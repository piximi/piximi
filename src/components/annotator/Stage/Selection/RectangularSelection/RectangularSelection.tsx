import React, { useContext } from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { useMarchingAnts } from "hooks";

import { StageContext } from "components/annotator/AnnotatorView/AnnotatorView";
import { imageOriginSelector } from "store/imageViewer";
import { RectangularAnnotationTool } from "annotator-tools";

type RectangularSelectionProps = {
  operator: RectangularAnnotationTool;
};

export const RectangularSelection = ({
  operator,
}: RectangularSelectionProps) => {
  const dashOffset = useMarchingAnts();

  const imageOrigin = useSelector(imageOriginSelector);
  const stageScale = useContext(StageContext)?.current?.scaleX() ?? 1;
  if (!operator.origin || !operator.width || !operator.height) return null;

  const x = operator.origin.x + imageOrigin.x;
  const y = operator.origin.y + imageOrigin.y;

  return (
    <>
      <ReactKonva.Group>
        <ReactKonva.Rect
          dash={[4 / stageScale, 2 / stageScale]}
          dashOffset={-dashOffset}
          height={operator.height}
          stroke="black"
          strokeWidth={1 / stageScale}
          width={operator.width}
          x={x}
          y={y}
        />
        <ReactKonva.Rect
          dash={[4 / stageScale, 2 / stageScale]}
          dashOffset={-dashOffset}
          height={operator.height}
          stroke="white"
          strokeWidth={1 / stageScale}
          width={operator.width}
          x={x}
          y={y}
        />
      </ReactKonva.Group>
    </>
  );
};
