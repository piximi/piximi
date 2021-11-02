import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toolTypeSelector } from "../../store/selectors";
import { ToolType } from "../../types/ToolType";
import { imageViewerSlice } from "../../store/slices";

export const useCursor = () => {
  const toolType = useSelector(toolTypeSelector);

  const dispatch = useDispatch();

  useEffect(() => {
    switch (toolType) {
      case ToolType.EllipticalAnnotation:
        dispatch(imageViewerSlice.actions.setCursor({ cursor: "crosshair" }));

        break;
      case ToolType.PenAnnotation:
        dispatch(imageViewerSlice.actions.setCursor({ cursor: "default" }));

        break;
      case ToolType.RectangularAnnotation:
        dispatch(imageViewerSlice.actions.setCursor({ cursor: "crosshair" }));
        break;
      default:
        dispatch(imageViewerSlice.actions.setCursor({ cursor: "pointer" }));

        break;
    }
  }, [toolType]);
};
