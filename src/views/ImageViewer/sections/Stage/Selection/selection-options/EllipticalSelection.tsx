import React, { useContext } from "react";
import { useSelector } from "react-redux";
import { Ellipse as KonvaEllipse, Group as KonvaGroup } from "react-konva";

import { useMarchingAnts } from "../../../../hooks";

import { StageContext } from "views/ImageViewer/state/StageContext";
import { selectImageOrigin } from "views/ImageViewer/state/imageViewer/selectors";

import { EllipticalAnnotationTool } from "views/ImageViewer/utils/tools";

type EllipticalSelectionProps = {
  operator: EllipticalAnnotationTool;
};

export const EllipticalSelection = ({ operator }: EllipticalSelectionProps) => {
  const dashOffset = useMarchingAnts();
  const imageOrigin = useSelector(selectImageOrigin);
  const stageScale = useContext(StageContext)?.current?.scaleX() ?? 1;
  if (!operator.center || !operator.radius) return null;

  const x = operator.center.x + imageOrigin.x;
  const y = operator.center.y + imageOrigin.y;

  return (
    <>
      <KonvaGroup>
        <KonvaEllipse
          dash={[4 / stageScale, 2 / stageScale]}
          dashOffset={-dashOffset}
          radiusX={operator.radius.x}
          radiusY={operator.radius.y}
          stroke="black"
          strokeWidth={1 / stageScale}
          x={x}
          y={y}
        />
        <KonvaEllipse
          dash={[4 / stageScale, 2 / stageScale]}
          dashOffset={-dashOffset}
          radiusX={operator.radius.x}
          radiusY={operator.radius.y}
          stroke="white"
          strokeWidth={1 / stageScale}
          x={x}
          y={y}
        />
      </KonvaGroup>
    </>
  );
};
