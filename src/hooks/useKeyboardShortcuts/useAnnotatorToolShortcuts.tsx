import { useDispatch, useSelector } from "react-redux";
import { useHotkeys } from "hooks";

import { imageViewerSlice } from "store/imageViewer";

import { annotatorSlice } from "store/annotator";

import { selectImageViewerImages } from "store/imageViewer/reselectors";
import { ToolType } from "utils/annotator/enums";
import { HotkeyContext } from "utils/common/enums";
import { selectActiveImageId } from "store/imageViewer/selectors";

export const useAnnotatorToolShortcuts = () => {
  const dispatch = useDispatch();

  const images = useSelector(selectImageViewerImages);
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
              annotatorSlice.actions.setToolType({
                operation: ToolType.ColorAnnotation,
              })
            );
            break;
          case "D":
            dispatch(
              annotatorSlice.actions.setToolType({
                operation: ToolType.PenAnnotation,
              })
            );
            break;
          case "E":
            dispatch(
              annotatorSlice.actions.setToolType({
                operation: ToolType.EllipticalAnnotation,
              })
            );
            break;
          case "I":
            dispatch(
              annotatorSlice.actions.setToolType({
                operation: ToolType.ColorAdjustment,
              })
            );
            break;
          case "L":
            dispatch(
              annotatorSlice.actions.setToolType({
                operation: ToolType.LassoAnnotation,
              })
            );
            break;
          case "M":
            dispatch(
              annotatorSlice.actions.setToolType({
                operation: ToolType.MagneticAnnotation,
              })
            );
            break;
          case "P":
            dispatch(
              annotatorSlice.actions.setToolType({
                operation: ToolType.PolygonalAnnotation,
              })
            );
            break;
          case "Q":
            dispatch(
              annotatorSlice.actions.setToolType({
                operation: ToolType.QuickAnnotation,
              })
            );
            break;
          case "R":
            dispatch(
              annotatorSlice.actions.setToolType({
                operation: ToolType.RectangularAnnotation,
              })
            );
            break;
          case "S":
            dispatch(
              annotatorSlice.actions.setToolType({
                operation: ToolType.Pointer,
              })
            );
            break;
          case "T":
            dispatch(
              annotatorSlice.actions.setToolType({
                operation: ToolType.ThresholdAnnotation,
              })
            );
            break;
          case "Z":
            dispatch(
              annotatorSlice.actions.setToolType({ operation: ToolType.Zoom })
            );
            break;
        }
      }
    },
    HotkeyContext.AnnotatorView
  );

  useHotkeys(
    "up",
    () => {
      if (!activeImageId) {
        return;
      }

      const activeImageIdx = images.findIndex(
        (image) => image.id === activeImageId
      );
      if (activeImageIdx < 1) {
        return;
      }

      const newActiveImageId = images[activeImageIdx - 1].id;
      dispatch(
        imageViewerSlice.actions.setActiveImageId({
          imageId: newActiveImageId,
          prevImageId: activeImageId,
        })
      );
    },
    HotkeyContext.AnnotatorView,
    [images, activeImageId]
  );

  useHotkeys(
    "down",
    () => {
      if (!activeImageId) {
        return;
      }

      const activeImageIdx = images.findIndex(
        (image) => image.id === activeImageId
      );
      if (activeImageIdx === -1 || activeImageIdx === images.length - 1) {
        return;
      }

      const newActiveImageId = images[activeImageIdx + 1].id;
      dispatch(
        imageViewerSlice.actions.setActiveImageId({
          imageId: newActiveImageId,
          prevImageId: activeImageId,
        })
      );
    },
    HotkeyContext.AnnotatorView,
    [images, activeImageId]
  );
};
