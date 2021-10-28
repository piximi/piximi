import * as ReactKonva from "react-konva";
import React from "react";
import { useMarchingAnts } from "../../../../../../annotator/hooks";
import { useSelector } from "react-redux";

import { pointerSelectionSelector } from "../../../../../../annotator/store/selectors/pointerSelectionSelector";
import { toolTypeSelector } from "../../../../../../annotator/store/selectors";
import { ToolType } from "../../../../../../annotator/types/ToolType";

export const PointerSelection = () => {
  const dashOffset = useMarchingAnts();

  const toolType = useSelector(toolTypeSelector);

  const { dragging, minimum, maximum, selecting } = useSelector(
    pointerSelectionSelector
  );

  if (!minimum || !maximum || !selecting || !dragging)
    return <React.Fragment />;

  if (toolType !== ToolType.Pointer) return <React.Fragment />;

  return (
    <React.Fragment>
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
    </React.Fragment>
  );
};
