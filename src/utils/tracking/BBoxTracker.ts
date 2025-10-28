import { getRandomHexColor } from "utils/colorUtils";
import { createOrderedAnnotationRecord, findOverlappingBoxes } from "./utils";
import { generateUUID } from "store/data/utils";
import type { BBoxTrackingConfig, CenterOfMass } from "./types";
import { DecodedAnnotationObject, Tracklet } from "store/data/types";

/**
 * Tracks objects across timepoints using bounding box overlap (IOU)
 *
 * Algorithm:
 * 1. Group annotations by timepoint
 * 2. For each timepoint (in order):
 *    - For each annotation:
 *      - Find best match in previous timepoint based on IOU
 *      - If IOU > threshold, assign to same track
 *      - Otherwise, create new track
 */
export class BBoxTracker {
  constructor(private config: BBoxTrackingConfig) {}

  /**
   * Compute tracks for a set of annotations
   */
  computeTracks(annotations: Record<string, DecodedAnnotationObject>) {
    const orderedAnnotations = createOrderedAnnotationRecord(
      annotations,
      this.config.numFrames,
    );
    const tracks: Record<string, Tracklet> = {};
    const ann2TrackId: Record<string, string> = {};

    let i = 0;
    while (i < orderedAnnotations.length - 1) {
      let nextTimepoint = 1;

      // filter visited annotations from timepoint
      const workingAnnotations = Object.values(orderedAnnotations[i]).filter(
        (ann) => !ann2TrackId[ann.id],
      );
      let currentTrackId: string | undefined = undefined;
      while (workingAnnotations.length > 0) {
        // get last annotation and remove from list
        const currentAnnotation = workingAnnotations.pop()!;

        // if new track, create new it and entry in track record, otherwise append to existing track
        if (!currentTrackId) {
          currentTrackId = generateUUID();
          tracks[currentTrackId] = {
            trackId: currentTrackId,
            metadataId: this.config.imageMetadataId,
            start: currentAnnotation.timepoint,
            linkedIds: [currentAnnotation.id],
            color: getRandomHexColor(),
          };
          ann2TrackId[currentAnnotation.id] = currentTrackId;
        } else {
          ann2TrackId[currentAnnotation.id] = currentTrackId;

          tracks[currentTrackId].linkedIds.push(currentAnnotation.id);
        }

        const nextAnnotations = orderedAnnotations[i + nextTimepoint];
        // stop at last timepoint
        if (!nextAnnotations) {
          nextTimepoint = 1;
          currentTrackId = undefined;
          continue;
        }

        const candidateAnns = Object.values(
          orderedAnnotations[i + nextTimepoint],
        ).filter((ann) => !ann2TrackId[ann.id]);

        // stop if there are no candidate annotations
        if (candidateAnns.length === 0) {
          nextTimepoint = 1;
          currentTrackId = undefined;
          continue;
        }

        const overlappedAnns = findOverlappingBoxes(
          currentAnnotation.boundingBox,
          candidateAnns,
        );

        const thresholdedAnns = overlappedAnns.filter(
          (ann) => ann.overlapArea >= this.config.overlapThreshold,
        );

        const greatestOverlapping = thresholdedAnns.sort(
          (a, b) => b.overlapArea - a.overlapArea,
        )[0];

        if (greatestOverlapping) {
          workingAnnotations.push(nextAnnotations[greatestOverlapping.id]);
          nextTimepoint++;
          continue;
        }
        nextTimepoint = 1;
        currentTrackId = undefined;
      }

      i++;
    }

    return {
      tracks: Object.values(tracks),
      coms: Object.values(annotations).reduce(
        (coms: Record<string, CenterOfMass>, ann) => {
          coms[ann.id] = {
            annotationId: ann.id,
            x: (ann.boundingBox[2] - ann.boundingBox[0]) / 2,
            y: (ann.boundingBox[3] - ann.boundingBox[1]) / 2,
          };
          return coms;
        },
        {},
      ),
    };
  }
}
