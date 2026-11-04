import { generateUUID } from "core/entities";

import { mutatingFilter } from "utils/arrayUtils";

import {
  createOrderedTrackInputs,
  findNearestNeighbors,
  groupByKind,
} from "./geometry";
import { getDefaultTrackColor } from "./trackColor";

import type {
  ComputedTracklet,
  CenterOfMass,
  CenterOfMassTrackingConfig,
  NearestNeighborResult,
  PendingTracklet,
  TrackInput,
  TrackingResult,
} from "./types";

/**
 * Tracks objects across timepoints using center-of-mass nearest neighbor algorithm.
 * Links annotations in sequential timepoints by computing their centers of mass and finding
 * the nearest neighbors below a distance threshold. Supports track splitting for cell division.
 */
export class CenterOfMassTracker {
  private getColor: () => string;

  constructor(private config: CenterOfMassTrackingConfig) {
    this.getColor = config.getColor ?? getDefaultTrackColor;
  }

  /**
   * Validates bidirectional parent-child relationships in the track graph
   */
  _validateTracks(tracks: Record<string, PendingTracklet>, warnings: string[]) {
    let isValid = true;
    Object.values(tracks).forEach((tracklet) => {
      if (tracklet.start === undefined || tracklet.end === undefined) {
        warnings.push(`Tracklet "${tracklet.id}" is not complete`);
        isValid = false;
      }
      tracklet.children?.forEach((childId) => {
        const childTracklet = tracks[childId];
        if (!childTracklet) {
          isValid = false;
          warnings.push(`Child of tracklet "${tracklet.id}" not found`);
        } else if (!childTracklet.parents?.includes(tracklet.id)) {
          isValid = false;
          warnings.push(
            `Child tracklet "${childId}" does not link back to "${tracklet.id}"`,
          );
        }
      });
    });
    return isValid;
  }

  _consolidateTracklets(tracklets: Record<string, PendingTracklet>) {
    Object.keys(tracklets).forEach((id) => {
      const track = tracklets[id];
      if (!track) return;

      // Absorb only children until the tracklet splits, merges or ends
      while (track.children?.length === 1) {
        const child = tracklets[track.children[0]];
        if (child.parents?.length !== 1) break;

        track.linkedIds.push(...child.linkedIds);
        track.end = child.end;
        track.children = child.children ?? [];
        track.children.forEach((grandchildId) => {
          const grandchild = tracklets[grandchildId];
          mutatingFilter(grandchild.parents!, (id) => id !== child.id);
          grandchild.parents!.push(track.id);
        });
        delete tracklets[child.id];
      }
    });

    return tracklets;
  }

  /**
   * Processes annotations frame-by-frame, linking them based on center-of-mass proximity
   * @returns Array of tracklets (optionally filtered to exclude single-frame tracks)
   */
  computeTracks(inputs: TrackInput[], kinds: string): TrackingResult {
    const results: TrackingResult = { tracks: [], coms: {}, warnings: [] };

    const groupedByKind = groupByKind(inputs, kinds);

    Object.values(groupedByKind).forEach((groupedAnnotations) => {
      const { ordered: orderedAnnotations, warnings } =
        createOrderedTrackInputs(groupedAnnotations, this.config.numFrames);
      results.warnings.push(...warnings);
      const tracks: Record<string, PendingTracklet> = {};
      const ann2TrackId: Record<string, string> = {};
      const initializedChildren: Record<string, PendingTracklet> = {};

      const centersOfMassRecord: Record<string, CenterOfMass> = {};
      Object.values(groupedAnnotations).forEach(({ id, center }) => {
        centersOfMassRecord[id] = { annotationId: id, ...center };
      });

      const finalizeTracklet = (
        annotation: TrackInput,
      ):
        | { success: false; trackletId: undefined }
        | { success: true; trackletId: string } => {
        if (!currentTracklet) return { success: false, trackletId: undefined };
        nextTimepoint = i + 1;

        currentTracklet.end = annotation.timepoint;
        if (
          !this.config.includeIsolatedAnnotations &&
          currentTracklet.end === currentTracklet.start
        ) {
          if (currentTracklet.children) {
            currentTracklet.children.forEach((childId) => {
              const initChildEntry = Object.entries(initializedChildren).find(
                (initChildEntry) => initChildEntry[1].id === childId,
              );
              if (!initChildEntry) {
                results.warnings.push("No child found in initialized record");
              } else {
                delete initializedChildren[initChildEntry[0]];
              }
            });
          }
          if (currentTracklet.parents) {
            currentTracklet.parents.forEach((parentId) => {
              const parent = tracks[parentId];
              if (!parent) {
                results.warnings.push("No parent tracklet found");
              } else if (!parent.children) {
                results.warnings.push("Parent has no children");
              } else {
                parent.children = parent.children?.filter(
                  (id) => id !== currentTracklet?.id,
                );
              }
            });
          }
          currentTracklet = undefined;
          return { success: false, trackletId: undefined };
        } else {
          tracks[currentTracklet.id] = currentTracklet;
          const trackletId = currentTracklet.id;
          currentTracklet = undefined;
          return { success: true, trackletId };
        }
      };

      // Process timepoints sequentially
      let i = 0;
      let trackNumber = 1;
      let nextTimepoint;
      let currentTracklet: PendingTracklet | undefined;
      while (i < orderedAnnotations.length) {
        nextTimepoint = i + 1;

        // Only consider annotations which havent already been added to a track
        const timepointAnnotations = Object.values(
          orderedAnnotations[i],
        ).filter((ann) => !ann2TrackId[ann.id]);

        currentTracklet = undefined;

        while (timepointAnnotations.length > 0) {
          const currentAnnotation = timepointAnnotations.pop()!;
          const currentCenter = centersOfMassRecord[currentAnnotation.id];

          if (!currentCenter) {
            results.warnings.push(
              `Could not find center of mass for ${currentAnnotation.id}`,
            );
            continue;
          }

          // If not already building on a tracklet, create a new tracklet to work with
          if (!currentTracklet) {
            // Check if the annotation belongs to a pre-initialized child tracklet.
            // If so use that tracklet, otherwise create a new track
            if (initializedChildren[currentAnnotation.id]) {
              currentTracklet = initializedChildren[currentAnnotation.id];
              delete initializedChildren[currentAnnotation.id];
            } else {
              currentTracklet = {
                id: generateUUID(),
                name: "Tracklet-" + trackNumber++,
                seriesId: this.config.seriesId,
                start: currentAnnotation.timepoint,
                linkedIds: [currentAnnotation.id],
                color: this.getColor(),
              };

              // Add annotation -> trackId to mapping
              ann2TrackId[currentAnnotation.id] = currentTracklet.id;
            }
          } else {
            // if the annotation is marked as belonging to a preinitialized child track, do not add it to the current track
            if (currentAnnotation.id in initializedChildren) continue;

            // Add annotation -> trackId to mapping, add annotation to tracklet linkedIds
            ann2TrackId[currentAnnotation.id] = currentTracklet.id;
            currentTracklet.linkedIds.push(currentAnnotation.id);
          }

          // EARLY EXIT CASE: Currently at the last timpoint of the series
          if (nextTimepoint >= orderedAnnotations.length) {
            finalizeTracklet(currentAnnotation);

            continue;
          }

          let gapClosingCounter = 0;
          const gapClosingDist = this.config.gapClosingDist ?? 0;
          let nearestNeighbor: NearestNeighborResult | undefined = undefined;
          let nextAnnotations: Record<string, TrackInput> = {};
          let matchedTimepoint: number = nextTimepoint;

          while (
            gapClosingCounter <= gapClosingDist &&
            nearestNeighbor === undefined &&
            nextTimepoint + gapClosingCounter < orderedAnnotations.length
          ) {
            const gapTimepoint = nextTimepoint + gapClosingCounter;
            matchedTimepoint = gapTimepoint;
            // Create a list of potential linked anns excluding those already in a tracklet or those which will become child tracklets
            nextAnnotations = orderedAnnotations[gapTimepoint];
            const candidateAnns = Object.values(nextAnnotations).filter(
              (ann) => {
                if (ann.id in initializedChildren) return false;
                if (!this.config.calculateTrackletRelationships)
                  return !ann2TrackId[ann.id];
                return true;
              },
            );

            // EARLY EXIT CASE: No potential annotations for linking in next timepoint
            if (candidateAnns.length === 0) {
              gapClosingCounter++;

              continue;
            }

            const candidateCenters = candidateAnns.map(
              (ann) => centersOfMassRecord[ann.id],
            );

            nearestNeighbor = findNearestNeighbors(
              currentCenter,
              candidateCenters,
              this.config.maxDistance,
            );
            gapClosingCounter++;
          }

          if (!nearestNeighbor) {
            finalizeTracklet(currentAnnotation);
            continue;
          }

          // CASE: Only a single nearest neighbor found
          // DECISION: Determine if nearest neighbor is tracked or untracked
          if (nearestNeighbor.targetId.length === 1) {
            const nn = nearestNeighbor.targetId[0];

            // CASE: nearest neighbor belongs to another track
            // DECISION: ensure current track is valid through finilization
            if (ann2TrackId[nn]) {
              const result = finalizeTracklet(currentAnnotation);

              // CASE: current tracklet id valid (exists and spans multiple timpoints, or we consider single timepoint tracks)
              // DECISION: process merge
              if (result.success === true) {
                // Prepare variables

                const finalizedTracklet = tracks[result.trackletId];
                const conflictingTracklet = tracks[ann2TrackId[nn]];
                const mergeAnnotation = groupedAnnotations[nn];

                // CASE: the conflicting tracklet starts at the merge point
                // DECISION: nothing to divide, add current tracklet as a parent
                if (conflictingTracklet.start === mergeAnnotation.timepoint) {
                  finalizedTracklet.children = [conflictingTracklet.id];
                  conflictingTracklet.parents = [
                    ...(conflictingTracklet.parents ?? []),
                    finalizedTracklet.id,
                  ];
                  continue;
                }

                const mergeTracklet: ComputedTracklet = {
                  id: generateUUID(),
                  name: "Tracklet-" + trackNumber++,
                  seriesId: this.config.seriesId,
                  start: mergeAnnotation.timepoint,
                  end: conflictingTracklet.end!,
                  linkedIds: [],
                  children: [],
                  parents: [],
                  color: this.getColor(),
                };

                // update linkedIds of conflicting and merged tracklets
                const conflictingTrackletNewLinkedIds: string[] = [];
                let conflictingTrackletEnd = conflictingTracklet.start!;
                conflictingTracklet.linkedIds.forEach((id) => {
                  const { timepoint } = groupedAnnotations[id];
                  if (timepoint >= mergeAnnotation.timepoint) {
                    mergeTracklet.linkedIds.push(id);
                  } else {
                    conflictingTrackletNewLinkedIds.push(id);
                    conflictingTrackletEnd = Math.max(
                      conflictingTrackletEnd,
                      timepoint,
                    );
                  }
                });
                conflictingTracklet.linkedIds = conflictingTrackletNewLinkedIds;
                conflictingTracklet.end = conflictingTrackletEnd;
                mergeTracklet.linkedIds.forEach((id) => {
                  ann2TrackId[id] = mergeTracklet.id;
                });

                // hand the conflicting tracklet's children to the merge tracklet
                mergeTracklet.children = conflictingTracklet.children;
                mergeTracklet.children?.forEach((childId) => {
                  const child =
                    tracks[childId] ??
                    Object.values(initializedChildren).find(
                      ({ id }) => id === childId,
                    );
                  if (child) {
                    child.parents = child.parents?.map((id) =>
                      id === conflictingTracklet.id ? mergeTracklet.id : id,
                    );
                  }
                });
                finalizedTracklet.children = [mergeTracklet.id];
                conflictingTracklet.children = [mergeTracklet.id];

                mergeTracklet.parents = [
                  finalizedTracklet.id,
                  conflictingTracklet.id,
                ];

                tracks[mergeTracklet.id] = mergeTracklet;
              }

              // start next tracklet
              continue;
            }

            // CASE: nearest neighbor does not belong to a tracklet
            // DECISION: add annotation to current tracklet and continue building current tracklet
            timepointAnnotations.push(
              nextAnnotations[nearestNeighbor.targetId[0]],
            );
            nextTimepoint = matchedTimepoint + 1;

            continue;
          }

          // CASE: multiple nearest neighbors found
          // DECISION: identify which are untracked and perform split if necessary
          if (nearestNeighbor.targetId.length > 1) {
            // find all of the untracked nearest neighbors
            const untrackedNNs = nearestNeighbor.targetId.filter(
              (id) => !ann2TrackId[id],
            );

            // CASE: every nearest neighbor belongs to a track
            // DECISION: finalize current track, dont calculate lineages
            if (untrackedNNs.length === 0) {
              finalizeTracklet(currentAnnotation);
              continue;
            }

            // CASE: single untracked nearest neighbor and 1 or more tracked nearest neighbors
            // DECISION: add single nearest neighbor to current track and continue building current tracklet
            if (untrackedNNs.length === 1) {
              timepointAnnotations.push(nextAnnotations[untrackedNNs[0]]);
              nextTimepoint = matchedTimepoint + 1;
              continue;
            }

            // CASE: multiple untracked nearest neigbors and 0 or more tracked nearest neighbors
            // DECISION: process split/division using only the untracked nearest neighbors
            if (this.config.calculateTrackletRelationships) {
              // create pre-initialized tracklets for children, will be used when associated annotation is visited
              let childIndex = 1;
              for (const id of untrackedNNs) {
                const childAnn = nextAnnotations[id];

                // create child tracklet
                const childTracklet = {
                  id: generateUUID(),
                  name: currentTracklet.name + `.${childIndex}`,
                  seriesId: this.config.seriesId,
                  start: childAnn.timepoint,
                  linkedIds: [id],
                  parents: [currentTracklet.id],
                  color: this.getColor(),
                };
                initializedChildren[id] = childTracklet;

                //update current tracklets children array
                if (currentTracklet.children) {
                  currentTracklet.children.push(childTracklet.id);
                } else {
                  currentTracklet.children = [childTracklet.id];
                }
                childIndex++;
              }
            }
            finalizeTracklet(currentAnnotation);
            continue;
          }
        }

        i++;
      }

      this._consolidateTracklets(tracks);
      if (this._validateTracks(tracks, results.warnings)) {
        results.tracks.push(
          ...(Object.values(tracks) as Array<ComputedTracklet>),
        );
        Object.assign(results.coms, centersOfMassRecord);
      }
    });
    return results;
  }
}
