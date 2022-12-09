import React from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { useImageOrigin, useMarchingAnts } from "hooks";

import { EllipticalAnnotationTool } from "annotator-tools";

type EllipticalSelectionProps = {
  operator: EllipticalAnnotationTool;
};

export const EllipticalSelection = ({ operator }: EllipticalSelectionProps) => {
  const dashOffset = useMarchingAnts();
  const imageOrigin = useImageOrigin();
  if (!operator.center || !operator.radius) return null;

  const x = operator.center.x + imageOrigin.x;
  const y = operator.center.y + imageOrigin.y;

  return (
    <>
      <ReactKonva.Group>
        <ReactKonva.Ellipse
          dash={[4, 2]}
          dashOffset={-dashOffset}
          radiusX={operator.radius.x}
          radiusY={operator.radius.y}
          stroke="black"
          strokeWidth={1}
          x={x}
          y={y}
        />
        <ReactKonva.Ellipse
          dash={[4, 2]}
          dashOffset={-dashOffset}
          radiusX={operator.radius.x}
          radiusY={operator.radius.y}
          stroke="white"
          strokeWidth={1}
          x={x}
          y={y}
        />
      </ReactKonva.Group>
    </>
  );
};
