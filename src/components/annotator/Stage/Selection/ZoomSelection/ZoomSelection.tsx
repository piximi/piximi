import React from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { stageScaleSelector, zoomSelectionSelector } from "store/imageViewer";

export const ZoomSelection = () => {
  const { dragging, minimum, maximum, selecting } = useSelector(
    zoomSelectionSelector
  );
  const stageScale = useSelector(stageScaleSelector);

  if (!minimum || !maximum || !selecting || !dragging) return <></>;

  return (
    <>
      <ReactKonva.Group>
        <ReactKonva.Rect
          dash={[4 / stageScale, 2 / stageScale]}
          height={maximum.y - minimum.y}
          stroke="black"
          strokeWidth={1 / stageScale}
          width={maximum.x - minimum.x}
          x={minimum.x}
          y={minimum.y}
        />
        <ReactKonva.Rect
          dash={[4 / stageScale, 2 / stageScale]}
          //dashOffset={-dashOffset}
          height={maximum.y - minimum.y}
          stroke="white"
          strokeWidth={1 / stageScale}
          width={maximum.x - minimum.x}
          x={minimum.x}
          y={minimum.y}
        />
      </ReactKonva.Group>
    </>
  );
};
