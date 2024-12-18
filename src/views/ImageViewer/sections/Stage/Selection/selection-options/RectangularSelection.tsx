import React, { useContext, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { useMarchingAnts } from "../../../../hooks";

import { StageContext } from "views/ImageViewer/state/StageContext";

import {
  RectangularAnnotationTool,
  SelectionTool,
} from "views/ImageViewer/utils/tools";
import { selectImageOrigin } from "views/ImageViewer/state/imageViewer/selectors";

type RectangularSelectionProps = {
  operator: RectangularAnnotationTool | SelectionTool;
};

export const RectangularSelection = ({
  operator,
}: RectangularSelectionProps) => {
  const dashOffset = useMarchingAnts();

  const imageOrigin = useSelector(selectImageOrigin);
  const stageScale = useContext(StageContext)?.current?.scaleX() ?? 1;
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);

  useEffect(() => {
    if (!operator.origin || !operator.width || !operator.height) return;
    setX(operator.origin.x + imageOrigin.x);
    setY(operator.origin.y + imageOrigin.y);
  }, [
    operator.origin,
    imageOrigin.x,
    imageOrigin.y,
    operator.width,
    operator.height,
  ]);

  return !operator.origin ||
    !operator.width ||
    !operator.height ||
    x === 0 ? null : (
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
