import { useDispatch, useSelector } from "react-redux";

import { useHotkeys } from "hooks";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { ToolType } from "views/ImageViewer/utils/enums";
import {
  selectActiveImageId,
  selectImageStackIds,
} from "@ImageViewer/state/image-viewer-data/selectors";
import { imageViewerDataSlice } from "@ImageViewer/state/image-viewer-data/imageViewerDataSlice";

import { HotkeyContext } from "utils/enums";

export const useAnnotatorToolShortcuts = () => {
  const dispatch = useDispatch();

  const images = useSelector(selectImageStackIds);
  const activeImageId = useSelector(selectActiveImageId);

  /*
   * Select color tool (C)
   */
  useHotkeys(
    "shift+C,shift+D,shift+E,shift+H,shift+I,shift+L,shift+M,shift+P,shift+Q,shift+R,shift+S,shift+T,shift+Z",
    (event, _handler) => {
      if (!event.repeat) {
        const key = event.key;
        switch (key) {
          case "C":
            dispatch(
              annotatorSlice.actions.setToolType(ToolType.ColorAnnotation),
            );
            break;
          case "D":
            dispatch(
              annotatorSlice.actions.setToolType(ToolType.PenAnnotation),
            );
            break;
          case "E":
            dispatch(
              annotatorSlice.actions.setToolType(ToolType.EllipticalAnnotation),
            );
            break;
          case "I":
            dispatch(
              annotatorSlice.actions.setToolType(ToolType.ColorAdjustment),
            );
            break;
          case "L":
            dispatch(
              annotatorSlice.actions.setToolType(ToolType.LassoAnnotation),
            );
            break;
          case "M":
            dispatch(
              annotatorSlice.actions.setToolType(ToolType.MagneticAnnotation),
            );
            break;
          case "P":
            dispatch(
              annotatorSlice.actions.setToolType(ToolType.PolygonalAnnotation),
            );
            break;
          case "Q":
            dispatch(
              annotatorSlice.actions.setToolType(ToolType.QuickAnnotation),
            );
            break;
          case "R":
            dispatch(
              annotatorSlice.actions.setToolType(
                ToolType.RectangularAnnotation,
              ),
            );
            break;
          case "S":
            dispatch(annotatorSlice.actions.setToolType(ToolType.Pointer));
            break;
          case "T":
            dispatch(
              annotatorSlice.actions.setToolType(ToolType.ThresholdAnnotation),
            );
            break;
          case "Z":
            dispatch(annotatorSlice.actions.setToolType(ToolType.Zoom));
            break;
        }
      }
    },
    HotkeyContext.AnnotatorView,
  );

  useHotkeys(
    "up",
    () => {
      if (!activeImageId) {
        return;
      }

      const activeImageIdx = images.findIndex(
        (imageId) => imageId === activeImageId,
      );
      if (activeImageIdx < 1) {
        return;
      }

      const newActiveImageId = images[activeImageIdx - 1];
      dispatch(imageViewerDataSlice.actions.setActiveImageId(newActiveImageId));
    },
    HotkeyContext.AnnotatorView,
    [images, activeImageId],
  );

  useHotkeys(
    "down",
    () => {
      if (!activeImageId) {
        return;
      }

      const activeImageIdx = images.findIndex(
        (imageId) => imageId === activeImageId,
      );
      if (activeImageIdx === -1 || activeImageIdx === images.length - 1) {
        return;
      }

      const newActiveImageId = images[activeImageIdx + 1];
      dispatch(imageViewerDataSlice.actions.setActiveImageId(newActiveImageId));
    },
    HotkeyContext.AnnotatorView,
    [images, activeImageId],
  );
};
