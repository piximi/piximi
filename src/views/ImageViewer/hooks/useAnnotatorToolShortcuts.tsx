import { useDispatch, useSelector } from "react-redux";
import { useHotkeys } from "hooks";

import { annotatorSlice } from "views/ImageViewer/state/annotator";

import { ToolType } from "views/ImageViewer/utils/enums";
import { HotkeyContext } from "utils/enums";
import {
  selectActiveMetadataId,
  selectMetadataStackArray,
} from "../state/image-viewer-data/selectors";
import { imageViewerDataSlice } from "../state/image-viewer-data/ImageViewerDataSlice";

export const useAnnotatorToolShortcuts = () => {
  const dispatch = useDispatch();

  const activeMetadataId = useSelector(selectActiveMetadataId);
  const metadataArray = useSelector(selectMetadataStackArray);

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
              }),
            );
            break;
          case "D":
            dispatch(
              annotatorSlice.actions.setToolType({
                operation: ToolType.PenAnnotation,
              }),
            );
            break;
          case "E":
            dispatch(
              annotatorSlice.actions.setToolType({
                operation: ToolType.EllipticalAnnotation,
              }),
            );
            break;
          case "I":
            dispatch(
              annotatorSlice.actions.setToolType({
                operation: ToolType.ColorAdjustment,
              }),
            );
            break;
          case "L":
            dispatch(
              annotatorSlice.actions.setToolType({
                operation: ToolType.LassoAnnotation,
              }),
            );
            break;
          case "M":
            dispatch(
              annotatorSlice.actions.setToolType({
                operation: ToolType.MagneticAnnotation,
              }),
            );
            break;
          case "P":
            dispatch(
              annotatorSlice.actions.setToolType({
                operation: ToolType.PolygonalAnnotation,
              }),
            );
            break;
          case "Q":
            dispatch(
              annotatorSlice.actions.setToolType({
                operation: ToolType.QuickAnnotation,
              }),
            );
            break;
          case "R":
            dispatch(
              annotatorSlice.actions.setToolType({
                operation: ToolType.RectangularAnnotation,
              }),
            );
            break;
          case "S":
            dispatch(
              annotatorSlice.actions.setToolType({
                operation: ToolType.Pointer,
              }),
            );
            break;
          case "T":
            dispatch(
              annotatorSlice.actions.setToolType({
                operation: ToolType.ThresholdAnnotation,
              }),
            );
            break;
          case "Z":
            dispatch(
              annotatorSlice.actions.setToolType({ operation: ToolType.Zoom }),
            );
            break;
        }
      }
    },
    HotkeyContext.AnnotatorView,
  );

  useHotkeys(
    "up",
    () => {
      if (!activeMetadataId) {
        return;
      }

      const activeMetadataIdx = metadataArray.findIndex(
        (metadata) => metadata.id === activeMetadataId,
      );
      if (activeMetadataIdx < 1) {
        return;
      }

      const newActiveImageId = metadataArray[activeMetadataIdx - 1].id;
      dispatch(
        imageViewerDataSlice.actions.setActiveMetadataId({
          metadataId: newActiveImageId,
          prevMetadataId: activeMetadataId,
        }),
      );
    },
    HotkeyContext.AnnotatorView,
    [metadataArray, activeMetadataId],
  );

  useHotkeys(
    "down",
    () => {
      if (!activeMetadataId) {
        return;
      }

      const activeMetadataIdx = metadataArray.findIndex(
        (metadata) => metadata.id === activeMetadataId,
      );
      if (
        activeMetadataIdx === -1 ||
        activeMetadataIdx === metadataArray.length - 1
      ) {
        return;
      }

      const newActiveMetadataId = metadataArray[activeMetadataIdx + 1].id;
      dispatch(
        imageViewerDataSlice.actions.setActiveMetadataId({
          metadataId: newActiveMetadataId,
          prevMetadataId: activeMetadataId,
        }),
      );
    },
    HotkeyContext.AnnotatorView,
    [metadataArray, activeMetadataId],
  );
};
