import { generateUUID } from "core/entities";

import {
  createOrderedTrackInputs,
  findOverlappingBoxes,
  groupByKind,
} from "./geometry";
import { getDefaultTrackColor } from "./trackColor";

import type {
  ComputedTracklet,
  BBoxTrackingConfig,
  TrackInput,
  TrackingResult,
} from "./types";

/**
 * Tracks objects across timepoints using bounding box overlap
 *
 * Algorithm:
 * 1. Group annotations by timepoint
 * 2. For each timepoint (in order):
 *    - For each annotation:
 *      - Find best match in next timepoint based on overlap
 *      - If overlap >= threshold, assign to same track
 *      - Otherwise, create new track
 */
export class BBoxTracker {
  private getColor: () => string;

  constructor(private config: BBoxTrackingConfig) {
    this.getColor = config.getColor ?? getDefaultTrackColor;
  }

  computeTracks(inputs: TrackInput[], kinds: string = "All"): TrackingResult {
    const results: TrackingResult = { tracks: [], coms: {}, warnings: [] };

    Object.values(groupByKind(inputs, kinds)).forEach((annotations) => {
      const { ordered: orderedAnnotations, warnings } =
        createOrderedTrackInputs(annotations, this.config.numFrames);
      results.warnings.push(...warnings);

      const tracks: ComputedTracklet[] = [];
      const visited = new Set<string>();

      orderedAnnotations.forEach((frame) => {
        Object.values(frame)
          .filter((ann) => !visited.has(ann.id))
          .reverse()
          .forEach((firstAnnotation) => {
            if (visited.has(firstAnnotation.id)) return;

            const track: ComputedTracklet = {
              id: generateUUID(),
              seriesId: this.config.seriesId,
              start: firstAnnotation.timepoint,
              end: firstAnnotation.timepoint,
              linkedIds: [],
              color: this.getColor(),
            };

            // Follow the best overlap forward until a frame has no match
            let current: TrackInput | undefined = firstAnnotation;
            while (current) {
              visited.add(current.id);
              track.linkedIds.push(current.id);
              track.end = current.timepoint;
              current = this._findMatch(
                current,
                orderedAnnotations[current.timepoint + 1],
                visited,
              );
            }

            tracks.push(track);
          });
      });

      const kept = this.config.includeIsolatedAnnotations
        ? tracks
        : tracks.filter(({ start, end }) => start !== end);
      kept.forEach((track, idx) => {
        results.tracks.push({ ...track, name: `Tracklet-${idx + 1}` });
      });

      Object.values(annotations).forEach(({ id, center }) => {
        results.coms[id] = { annotationId: id, ...center };
      });
    });

    return results;
  }

  _findMatch(
    annotation: TrackInput,
    nextFrame: Record<string, TrackInput> | undefined,
    visited: Set<string>,
  ): TrackInput | undefined {
    if (!nextFrame) return undefined;

    const candidates = Object.values(nextFrame).filter(
      (ann) => !visited.has(ann.id),
    );
    const best = findOverlappingBoxes(annotation.boundingBox, candidates)
      .filter(({ overlap }) => overlap >= this.config.overlapThreshold)
      .sort((a, b) => b.overlap - a.overlap)[0];

    return best && nextFrame[best.id];
  }
}
