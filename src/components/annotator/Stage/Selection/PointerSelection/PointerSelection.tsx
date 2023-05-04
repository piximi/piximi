import React from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { imageOriginSelector } from "store/imageViewer";
import {
  selectPointerSelection,
  selectToolType,
} from "store/annotator/selectors";

import { ToolType } from "types";

export const PointerSelection = () => {
  const toolType = useSelector(selectToolType);

  const { dragging, minimum, maximum, selecting } = useSelector(
    selectPointerSelection
  );
  const imagePosition = useSelector(imageOriginSelector);

  if (!minimum || !maximum || !selecting || !dragging) return <></>;

  if (toolType !== ToolType.Pointer) return <></>;

  return (
    <>
      <ReactKonva.Rect
        dash={[4, 2]}
        height={maximum.y - minimum.y}
        stroke="white"
        strokeWidth={1}
        width={maximum.x - minimum.x}
        x={minimum.x + imagePosition.x}
        y={minimum.y + imagePosition.y}
      />
    </>
  );
};
