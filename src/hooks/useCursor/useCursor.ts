import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { ToolType } from "types";
import { AnnotatorSlice, toolTypeSelector } from "store/annotator";

export const useCursor = () => {
  const toolType = useSelector(toolTypeSelector);

  const dispatch = useDispatch();

  useEffect(() => {
    switch (toolType) {
      case ToolType.RectangularAnnotation:
      case ToolType.EllipticalAnnotation:
        dispatch(AnnotatorSlice.actions.setCursor({ cursor: "crosshair" }));

        break;
      case ToolType.PenAnnotation:
        dispatch(AnnotatorSlice.actions.setCursor({ cursor: "none" }));

        break;

      default:
        dispatch(AnnotatorSlice.actions.setCursor({ cursor: "pointer" }));

        break;
    }
  }, [dispatch, toolType]);
};
