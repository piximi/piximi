import { Dispatch } from "@reduxjs/toolkit";
import { batch } from "react-redux";

import { dataSlice } from "store/data";
import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";
import { ProtoAnnotationObject } from "views/ImageViewer/state/types";

/**
 * Handles the tracking logic when an annotation is clicked in manual linking mode.
 * This function manages the assignment and removal of trackIds for annotations,
 * ensuring proper linkage between annotations across timepoints.
 *
 * @param currentAnnotation - The annotation that was clicked
 * @param activeTrackId - The currently active track ID
 * @param activeTraclIm2Ann - Map of image IDs to annotation IDs for the active track
 * @param dispatch - Redux dispatch function
 */
export const handleAnnotationTracking = (
  currentAnnotation: ProtoAnnotationObject,
  activeTrackId: string | undefined,
  activeTraclIm2Ann: Record<string, string>,
  dispatch: Dispatch,
) => {
  let annTrackId = currentAnnotation.trackId;

  // If the current annotation belongs to a track, check to see if it is the active track
  // if not, do nothing
  if (annTrackId && annTrackId !== activeTrackId) return;

  const activeTimeLinkedAnnId = activeTraclIm2Ann[currentAnnotation.imageId];

  // Assign a track ID to annotation if one doesn't exist
  if (!annTrackId) {
    annTrackId = activeTrackId!; // Can assert Truthy since tLinkingActive is true
    batch(() => {
      dispatch(
        dataSlice.actions.updateAnnotation({
          id: currentAnnotation.id,
          changes: { trackId: annTrackId },
        }),
      );
      dispatch(
        dataSlice.actions.addAnnotationToTrackletRecord({
          trackId: annTrackId!,
          annId: currentAnnotation.id,
        }),
      );
    });

    if (activeTimeLinkedAnnId) {
      dataSlice.actions.updateAnnotation({
        id: currentAnnotation.id,
        changes: { trackId: undefined },
      });
      dispatch(
        dataSlice.actions.removeAnnotationFromTrackletRecord({
          trackId: annTrackId,
          annId: activeTimeLinkedAnnId,
        }),
      );
    }
  } else {
    if (activeTimeLinkedAnnId) {
      dispatch(
        dataSlice.actions.updateAnnotation({
          id: currentAnnotation.id,
          changes: { trackId: undefined },
        }),
      );
      dispatch(
        dataSlice.actions.removeAnnotationFromTrackletRecord({
          trackId: annTrackId,
          annId: activeTimeLinkedAnnId,
        }),
      );
    }
    if (activeTimeLinkedAnnId !== currentAnnotation.id) {
      dataSlice.actions.updateAnnotation({
        id: currentAnnotation.id,
        changes: { trackId: annTrackId },
      });
      dispatch(
        dataSlice.actions.addAnnotationToTrackletRecord({
          trackId: annTrackId,
          annId: currentAnnotation.id,
        }),
      );
    }
  }

  dispatch(
    imageViewerDataSlice.actions.toggleTLinkedAnnotation({
      annId: currentAnnotation.id,
      imId: currentAnnotation.imageId,
    }),
  );
};
