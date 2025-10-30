import { Dispatch } from "@reduxjs/toolkit";

import { dataSlice } from "store/data";
import { ProtoAnnotationObject } from "views/ImageViewer/state/types";

/**
 * Handles the tracking logic when an annotation is clicked in manual linking mode.
 * This function manages the assignment and removal of trackIds for annotations,
 * ensuring proper linkage between annotations across timepoints.
 *
 * @param currentAnnotation - The annotation that was clicked
 * @param activeTrackId - The currently active track ID
 * @param activeTrackedAnnsByImage - Map of image IDs to annotation IDs for the active track
 * @param dispatch - Redux dispatch function
 */
export const handleAnnotationTracking = (
  currentAnnotation: ProtoAnnotationObject,
  activeTrackId: string,
  dispatch: Dispatch,
) => {
  const annTrackId = currentAnnotation.trackId;
  const isTrackedAnnotation = !!annTrackId;
  const annotationInActiveTracklet = annTrackId === activeTrackId;

  // Assign a track ID to annotation if one doesn't exist
  if (!isTrackedAnnotation) {
    dispatch(
      dataSlice.actions.addAnnotationToTrackletRecord({
        trackId: activeTrackId,
        annId: currentAnnotation.id,
      }),
    );
  } else if (isTrackedAnnotation && annotationInActiveTracklet) {
    dispatch(
      dataSlice.actions.removeAnnotationFromTrackletRecord({
        trackId: annTrackId,
        annId: currentAnnotation.id,
      }),
    );
  }
};
