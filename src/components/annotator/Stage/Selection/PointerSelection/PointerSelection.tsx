import React from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import {
  imageOriginSelector,
  pointerSelectionSelector,
  toolTypeSelector,
} from "store/annotator";

import { ToolType } from "types";

export const PointerSelection = () => {
  const toolType = useSelector(toolTypeSelector);

  const { dragging, minimum, maximum, selecting } = useSelector(
    pointerSelectionSelector
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
