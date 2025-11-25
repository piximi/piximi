import { Dispatch } from "@reduxjs/toolkit";

import { trackEditingSlice } from "views/ImageViewer/state/tracklet-editing/trackletEditingSlice";
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
  activeTrackAnnotations: string[],
  dispatch: Dispatch,
) => {
  const annTrackId = currentAnnotation.trackId;
  const isTrackedAnnotation = !!annTrackId;
  const annotationInActiveTracklet = activeTrackAnnotations.includes(
    currentAnnotation.id,
  );

  // Ensure only untracked annotations or annotations in the current edit session are operated on
  if (isTrackedAnnotation && currentAnnotation.trackId !== activeTrackId)
    return;

  if (!annotationInActiveTracklet) {
    // Assign a track ID to annotation if one doesn't exist
    dispatch(
      trackEditingSlice.actions.addAnnotationToPendingTracklet({
        annId: currentAnnotation.id,
        timepoint: currentAnnotation.timepoint,
      }),
    );
  } else {
    dispatch(
      trackEditingSlice.actions.removeAnnotationFromPendingTracklet({
        annId: currentAnnotation.id,
        timepoint: currentAnnotation.timepoint,
      }),
    );
  }
};
