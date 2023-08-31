import React, { useContext } from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { StageContext } from "views/ImageViewer/ImageViewer";
import { selectZoomSelection } from "store/imageViewer";

export const ZoomSelection = () => {
  const { dragging, minimum, maximum, selecting } =
    useSelector(selectZoomSelection);
  const stageRef = useContext(StageContext);

  if (!minimum || !maximum || !selecting || !dragging) return <></>;

  return (
    <>
      <ReactKonva.Group>
        <ReactKonva.Rect
          dash={[
            4 / stageRef?.current?.scaleX()!,
            2 / stageRef?.current?.scaleX()!,
          ]}
          height={maximum.y - minimum.y}
          stroke="black"
          strokeWidth={1 / stageRef?.current?.scaleX()!}
          width={maximum.x - minimum.x}
          x={minimum.x}
          y={minimum.y}
        />
        <ReactKonva.Rect
          dash={[
            4 / stageRef?.current?.scaleX()!,
            2 / stageRef?.current?.scaleX()!,
          ]}
          //dashOffset={-dashOffset}
          height={maximum.y - minimum.y}
          stroke="white"
          strokeWidth={1 / stageRef?.current?.scaleX()!}
          width={maximum.x - minimum.x}
          x={minimum.x}
          y={minimum.y}
        />
      </ReactKonva.Group>
    </>
  );
};
