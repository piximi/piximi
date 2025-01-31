import React, { useContext } from "react";
import { useSelector } from "react-redux";
import { Group as KonvaGroup, Rect as KonvaRect } from "react-konva";

import { StageContext } from "views/ImageViewer/state/StageContext";
import { selectZoomSelection } from "../../../../state/imageViewer/selectors";

export const ZoomSelection = () => {
  const { dragging, minimum, maximum, selecting } =
    useSelector(selectZoomSelection);
  const stageRef = useContext(StageContext);

  if (!minimum || !maximum || !selecting || !dragging) return <></>;

  return (
    <>
      <KonvaGroup>
        <KonvaRect
          dash={[
            // or 100 for no particular reason, because it shouldn't happen
            4 / (stageRef?.current?.scaleX() || 100),
            2 / (stageRef?.current?.scaleX() || 100),
          ]}
          height={maximum.y - minimum.y}
          stroke="black"
          strokeWidth={1 / (stageRef?.current?.scaleX() || 100)}
          width={maximum.x - minimum.x}
          x={minimum.x}
          y={minimum.y}
        />
        <KonvaRect
          dash={[
            // or 100 for no particular reason, because it shouldn't happen
            4 / (stageRef?.current?.scaleX() || 100),
            2 / (stageRef?.current?.scaleX() || 100),
          ]}
          //dashOffset={-dashOffset}
          height={maximum.y - minimum.y}
          stroke="white"
          strokeWidth={1 / (stageRef?.current?.scaleX() || 100)}
          width={maximum.x - minimum.x}
          x={minimum.x}
          y={minimum.y}
        />
      </KonvaGroup>
    </>
  );
};
