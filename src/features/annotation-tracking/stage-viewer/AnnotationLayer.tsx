import React, { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Layer, Line } from "react-konva";

import { UNKNOWN_IMAGE_CATEGORY_COLOR } from "store/data/constants";
import { selectImageToAnnotations } from "store/data/selectors";

import { hexAlpha } from "utils/colorUtils";
import { selectActiveMetadataDecodedAnnotationRecord } from "views/ImageViewer/state/image-viewer-data/reselectors";
import { selectActiveMetadata } from "views/ImageViewer/state/image-viewer-data/selectors";

import { handleAnnotationTracking } from "../utils/trackingActions";
import { AnnotationShape } from "./AnnotationShape";
import { AnnotationLayerProps, AnnotationWithImOff } from "../utils/types";
import {
  selectEditSession,
  selectManagementActive,
  selectSelectedTrackletIds,
} from "views/ImageViewer/state/tracklet-editing/selectors";
import { DecodedAnnotationObject, Tracklet } from "store/data/types";
import { Point } from "utils/types";
import { selectPendingTrackletEntities } from "views/ImageViewer/state/tracklet-editing/reselectors";
import { trackEditingSlice } from "views/ImageViewer/state/tracklet-editing/trackletEditingSlice";
import { isEmpty } from "lodash";

/**
 * A Konva layer that renders all visible annotations with track coloring.
 * Filters annotations by active metadata and applies track-based color styling.
 * Also renders center-of-mass lines for selected tracks.
 */

const getTrackCOMs = (
  tracklets: Record<string, Tracklet>,
  annotations: Record<string, DecodedAnnotationObject>,
  imageLocation: Record<string, { pos: Point }>,
): Record<string, Array<number>> | undefined => {
  if (isEmpty(imageLocation)) {
    console.error("No image locations for calulating annotation COMs");
    return {};
  }
  const trackCOMs: Record<string, Array<number>> = {};
  for (const trackId of Object.keys(tracklets)) {
    const tracklet = tracklets[trackId];
    const trackletAnnotations = tracklet.linkedIds;
    trackCOMs[trackId] = [];
    for (const annId of trackletAnnotations) {
      const annCOM = annotations[annId].measurements?.com;
      const imageId = annotations[annId].imageId;
      const imOffset = imageLocation[imageId].pos;
      if (annCOM)
        trackCOMs[trackId].push(
          ...[annCOM.x + imOffset.x, annCOM.y + imOffset.y],
        );
    }
  }
  return trackCOMs;
};

const getStageAnnotations = (
  annotations: DecodedAnnotationObject[],
  imagePositions: Record<string, { pos: Point }>,
): AnnotationWithImOff[] => {
  const visibleAnnotations: AnnotationWithImOff[] = [];
  annotations.forEach((ann) => {
    if (imagePositions[ann.imageId])
      visibleAnnotations.push({
        ...ann,
        imageOffset: imagePositions[ann.imageId].pos,
      } as AnnotationWithImOff);
  });

  return visibleAnnotations;
};
export const AnnotationLayer = ({
  imageShape,
  images,
}: AnnotationLayerProps) => {
  const dispatch = useDispatch();
  const tracklets = useSelector(selectPendingTrackletEntities);
  const annotations = useSelector(selectActiveMetadataDecodedAnnotationRecord);
  const imageToAnnotations = useSelector(selectImageToAnnotations);
  const activeMetadata = useSelector(selectActiveMetadata);
  const editSession = useSelector(selectEditSession);
  const selectedTracks = useSelector(selectSelectedTrackletIds);
  const managementActive = useSelector(selectManagementActive);

  const trackCOMs = useMemo(() => {
    return getTrackCOMs(tracklets, annotations, images);
  }, [tracklets, annotations, images]);

  const selectedCOMs = useMemo(() => {
    if (!trackCOMs) return [];
    return selectedTracks.map((trackletId) => ({
      color: tracklets[trackletId].color,
      line: trackCOMs[trackletId],
    }));
  }, [tracklets, trackCOMs, selectedTracks]);

  const stageAnnotations = useMemo(() => {
    if (!activeMetadata) return [];
    return getStageAnnotations(Object.values(annotations), images);
  }, [annotations, activeMetadata, imageToAnnotations, images]);

  // Handle annotation click (tracking or selection)
  const handleAnnotationClick = useCallback(
    (annotationId: string) => {
      if (managementActive) return;
      const annotation = annotations[annotationId];
      if (editSession.mode !== null) {
        handleAnnotationTracking(
          annotation,
          editSession.trackletId,
          editSession.pendingTracklet.linkedIds,
          dispatch,
        );
      } else {
        if (!annotation.trackId) return;
        dispatch(
          trackEditingSlice.actions.toggleSelectedTracklet(annotation.trackId),
        );
      }
    },
    [editSession, annotations, dispatch],
  );
  const getFillColor = useCallback(
    (annotation: AnnotationWithImOff) => {
      const trackId = annotation.trackId;

      // If the annotation does not have a trackId, it might still
      // be part of a pending tracklet
      if (!trackId) {
        if (
          editSession.mode !== null &&
          editSession.pendingTracklet?.linkedIds &&
          editSession.pendingTracklet.linkedIds.includes(annotation.id)
        ) {
          return hexAlpha(editSession.pendingTracklet.color, 0.5);
        }
        return UNKNOWN_IMAGE_CATEGORY_COLOR;
      }

      // If an annotation has a trackId, it is possible it has been
      // removed from a pending tracklet
      if (
        editSession.mode === "edit" &&
        annotation.trackId === editSession.trackletId
      ) {
        if (!editSession.pendingTracklet.linkedIds.includes(annotation.id))
          return UNKNOWN_IMAGE_CATEGORY_COLOR;
        else return hexAlpha(editSession.pendingTracklet.color, 0.5);
      }
      const trackColor = tracklets[trackId].color;
      if (selectedTracks.includes(trackId)) return hexAlpha(trackColor, 1);
      return selectedTracks.length < 0
        ? hexAlpha(trackColor, 0.2)
        : hexAlpha(trackColor, 0.5);
    },
    [editSession, selectedTracks, tracklets],
  );

  return images ? (
    <Layer>
      {stageAnnotations.map((annotation) => (
        <AnnotationShape
          key={annotation.id}
          annotation={annotation}
          imageShape={imageShape}
          imagePosition={annotation.imageOffset}
          fillColor={getFillColor(annotation)}
          selected={true}
          isFiltered={false}
          onSelect={handleAnnotationClick}
        />
      ))}
      {selectedCOMs.map((coms, idx) => (
        <Line
          key={`line-${idx}`}
          points={coms.line}
          dash={[10, 10]}
          stroke={coms.color}
          strokeWidth={10}
          opacity={0.75}
        />
      ))}
    </Layer>
  ) : (
    <></>
  );
};
