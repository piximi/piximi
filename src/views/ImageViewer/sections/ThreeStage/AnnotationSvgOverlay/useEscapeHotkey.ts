import { useDispatch, useSelector } from "react-redux";

import { useHotkeys } from "hooks";

import { HotkeyContext } from "utils/enums";

import { imageViewerDataSlice } from "@ImageViewer/state/imageViewerData";
import { selectHasSelection } from "@ImageViewer/state/imageViewerData/reselectors";
import { AnnotationState } from "@ImageViewer/utils/enums";

import { useAnnotationConfirmation } from "./useAnnotationConfirmation";

import type { AnnotationTool } from "@ImageViewer/core/annotation-tools";

/**
 * Escape backs out of whatever the user is in the middle of. Bound on the
 * always-mounted overlay rather than the confirm chrome, because a stroke that
 * is still being drawn (a polygon between clicks) has no chrome yet.
 */
export const useEscapeHotkey = (annotationTool: AnnotationTool) => {
  const dispatch = useDispatch();
  const hasSelection = useSelector(selectHasSelection);
  const { cancel, hasUpdates } = useAnnotationConfirmation(annotationTool);

  useHotkeys(
    "esc",
    (event) => {
      if (event.repeat) return;
      // In progress: the tool is mid-stroke, or a finished stroke or staged
      // operation is waiting on confirm. `cancel` clears all three.
      const inProgress =
        hasUpdates || annotationTool.annotationState !== AnnotationState.Blank;
      if (inProgress) {
        cancel();
        return;
      }
      if (hasSelection) {
        dispatch(imageViewerDataSlice.actions.clearSelectionLayer());
      }
    },
    HotkeyContext.AnnotatorView,
    [annotationTool, cancel, hasUpdates, hasSelection, dispatch],
  );
};
