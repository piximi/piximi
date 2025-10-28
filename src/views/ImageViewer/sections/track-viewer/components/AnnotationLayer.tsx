import React, { useMemo } from "react";
import { useSelector } from "react-redux";
import { Layer, Line } from "react-konva";

import { UNKNOWN_IMAGE_CATEGORY_COLOR } from "store/data/constants";
import {
  selectImageToAnnotations,
  selectTrackletRecord,
} from "store/data/selectors";

import { hexAlpha } from "utils/colorUtils";
import { selectAllImageViewerAnnotationRecord } from "views/ImageViewer/state/image-viewer-data/reselectors";
import { selectActiveMetadata } from "views/ImageViewer/state/image-viewer-data/selectors";

import { AnnotationsProps, AnnotationWithImOff } from "../types";
import { AnnotationShape } from "./AnnotationShape";
import { selectAnnotationMeasurements } from "store/measurements/measurementDataSelectors";

/**
 * A Konva layer that renders all visible annotations with track coloring.
 * Filters annotations by active metadata and applies track-based color styling.
 * Also renders center-of-mass lines for selected tracks.
 */
export const AnnotationLayer: React.FC<AnnotationsProps> = ({
  imageShape,
  images,
  selectedTracks,
  onClick,
}) => {
  const tracklets = useSelector(selectTrackletRecord);
  const annotations = useSelector(selectAllImageViewerAnnotationRecord);
  const imageToAnnotations = useSelector(selectImageToAnnotations);
  const activeMetadata = useSelector(selectActiveMetadata);
  const annotationMeasurements = useSelector(selectAnnotationMeasurements);

  const trackCOMs = useMemo(() => {
    const trackCOMs: Record<string, Array<number>> = {};
    for (const trackId of Object.keys(tracklets)) {
      const tracklet = tracklets[trackId];
      const trackletAnnotations = tracklet.linkedIds;
      trackCOMs[trackId] = [];
      for (const annId of trackletAnnotations) {
        const annCOM = annotationMeasurements[annId]?.["object-geometry-com"];
        const imageId = annotations[annId].imageId;
        const imOffset = images[imageId].pos;
        if (annCOM)
          trackCOMs[trackId].push(
            ...[annCOM.x + imOffset.x, annCOM.y + imOffset.y],
          );
      }
    }
    return trackCOMs;
  }, [tracklets, annotationMeasurements]);

  const selectedCOMs = useMemo(() => {
    return selectedTracks.map((trackletId) => ({
      color: tracklets[trackletId].color,
      line: trackCOMs[trackletId],
    }));
  }, [trackCOMs, selectedTracks]);

  const visibleAnnotations = useMemo(() => {
    if (!activeMetadata) return [];
    const visibleAnnotations: AnnotationWithImOff[] = [];
    Object.keys(activeMetadata.images).forEach((imageId) => {
      const imAnnotations = imageToAnnotations[imageId];
      imAnnotations.forEach((annId) => {
        const ann = annotations[annId];
        if (ann.decodedMask)
          if (images[ann.imageId]) {
            visibleAnnotations.push({
              ...ann,
              imageOffset: images[ann.imageId].pos,
            } as AnnotationWithImOff);
          }
      });
    });
    return visibleAnnotations;
  }, [annotations, activeMetadata, imageToAnnotations, images]);

  const getFillColor = (trackId: string | undefined) => {
    if (!trackId) return UNKNOWN_IMAGE_CATEGORY_COLOR;
    const trackColor = tracklets[trackId].color;
    if (selectedTracks.includes(trackId)) return hexAlpha(trackColor, 1);
    return selectedTracks.length < 0
      ? hexAlpha(trackColor, 0.2)
      : hexAlpha(trackColor, 0.5);
  };

  return images ? (
    <Layer>
      {visibleAnnotations.map((annotation) => (
        <AnnotationShape
          key={annotation.id}
          annotation={annotation}
          imageShape={imageShape}
          imagePosition={annotation.imageOffset}
          fillColor={getFillColor(annotation.trackId)}
          selected={true}
          isFiltered={false}
          onSelect={() => {
            onClick(annotation);
          }}
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
