import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toolTypeSelector } from "../../store/selectors";
import { ToolType } from "../../types/ToolType";
import { applicationSlice } from "../../store/slices";

export const useCursor = () => {
  const toolType = useSelector(toolTypeSelector);

  const dispatch = useDispatch();

  useEffect(() => {
    switch (toolType) {
      case ToolType.EllipticalAnnotation:
        dispatch(applicationSlice.actions.setCursor({ cursor: "crosshair" }));

        break;
      case ToolType.PenAnnotation:
        dispatch(applicationSlice.actions.setCursor({ cursor: "default" }));

        break;
      case ToolType.RectangularAnnotation:
        dispatch(applicationSlice.actions.setCursor({ cursor: "crosshair" }));
        break;
      default:
        dispatch(applicationSlice.actions.setCursor({ cursor: "pointer" }));

        break;
    }
  }, [toolType]);
};
