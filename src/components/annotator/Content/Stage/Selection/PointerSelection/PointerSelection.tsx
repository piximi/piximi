import React from "react";
import { useSelector } from "react-redux";
import * as ReactKonva from "react-konva";

import { pointerSelectionSelector } from "store/selectors/pointerSelectionSelector";
import { toolTypeSelector } from "store/selectors";

import { ToolType } from "types/ToolType";

export const PointerSelection = () => {
  const toolType = useSelector(toolTypeSelector);

  const { dragging, minimum, maximum, selecting } = useSelector(
    pointerSelectionSelector
  );

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
        x={minimum.x}
        y={minimum.y}
      />
    </>
  );
};
