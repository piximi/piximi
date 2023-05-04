import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import { ToolType } from "types";
import { imageViewerSlice } from "store/imageViewer";
import { selectToolType } from "store/annotator/selectors";

export const useCursor = () => {
  const toolType = useSelector(selectToolType);

  const dispatch = useDispatch();

  useEffect(() => {
    switch (toolType) {
      case ToolType.RectangularAnnotation:
      case ToolType.EllipticalAnnotation:
        dispatch(imageViewerSlice.actions.setCursor({ cursor: "crosshair" }));

        break;
      case ToolType.PenAnnotation:
        dispatch(imageViewerSlice.actions.setCursor({ cursor: "none" }));

        break;

      default:
        dispatch(imageViewerSlice.actions.setCursor({ cursor: "pointer" }));

        break;
    }
  }, [dispatch, toolType]);
};
