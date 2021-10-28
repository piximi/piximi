import * as ReactKonva from "react-konva";
import React from "react";
import { useMarchingAnts } from "../../../../../../annotator/hooks";
import { useSelector } from "react-redux";
import { zoomSelectionSelector } from "../../../../../../annotator/store/selectors";

export const ZoomSelection = ({}) => {
  const dashOffset = useMarchingAnts();

  const { dragging, minimum, maximum, selecting } = useSelector(
    zoomSelectionSelector
  );

  if (!minimum || !maximum || !selecting || !dragging)
    return <React.Fragment />;

  return (
    <ReactKonva.Group>
      <ReactKonva.Rect
        dash={[4, 2]}
        dashOffset={-dashOffset}
        height={maximum.y - minimum.y}
        stroke="black"
        strokeWidth={1}
        width={maximum.x - minimum.x}
        x={minimum.x}
        y={minimum.y}
      />

      <ReactKonva.Rect
        dash={[4, 2]}
        dashOffset={-dashOffset}
        height={maximum.y - minimum.y}
        stroke="white"
        strokeWidth={1}
        width={maximum.x - minimum.x}
        x={minimum.x}
        y={minimum.y}
      />
    </ReactKonva.Group>
  );
};
