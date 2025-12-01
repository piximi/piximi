import { getRestrictedRandomHexColor } from "utils/colorUtils";
import {
  calculateCenterOfMass,
  createOrderedAnnotationRecord,
  findNearestNeighbors,
} from "./utils";
import { generateUUID } from "store/data/utils";
import type {
  CenterOfMassTrackingConfig,
  CenterOfMass,
  NearestNeighborResult,
} from "./types";
import {
  DecodedAnnotationObject,
  PendingTracklet,
  Tracklet,
} from "store/data/types";
import { mutatingFilter } from "utils/arrayUtils";

/**
 * Tracks objects across timepoints using center-of-mass nearest neighbor algorithm.
 * Links annotations in sequential timepoints by computing their centers of mass and finding
 * the nearest neighbors below a distance threshold. Supports track splitting for cell division.
 */
export class CenterOfMassTracker {
  annotationCOMs: Record<string, CenterOfMass> = {};
  constructor(private config: CenterOfMassTrackingConfig) {}

  /**
   * Validates bidirectional parent-child relationships in the track graph
   */
  _validateTracks(tracks: Record<string, PendingTracklet>) {
    const recordedChildren: string[] = [];
    let isValid = true;
    Object.values(tracks).forEach((tracklet) => {
      if (tracklet.start === undefined || tracklet.end === undefined) {
        console.error(`Tracklet with id "${tracklet.id}" not complete:`);
        console.error(tracklet);

        isValid = false;
      }
      if (tracklet.children) {
        recordedChildren.push(...tracklet.children);

        tracklet.children.forEach((childId) => {
          const childTracklet = tracks[childId];
          if (!childTracklet) {
            isValid = false;
            console.error("ERROR: child tracklet not found");
            console.error(tracklet);
          } else if (
            !childTracklet.parents ||
            childTracklet.parents.length === 0
          ) {
            isValid = false;
            console.error("ERROR: child track has no parent");
          }
        });
      }
    });
    return isValid;
  }

  /**
   * Filters out single-frame tracklets (start === end) and cleans up their parent-child relationships
   */
  filterIsolated(tracks: Record<string, PendingTracklet>): Tracklet[] {
    const tracksDupe = { ...tracks } as Record<string, Tracklet>;

    Object.values(tracks).forEach((track) => {
      if (track.start === track.end) {
        if (track.children) {
          track.children.forEach((childId) => {
            if (tracksDupe[childId])
              tracksDupe[childId].parents = tracksDupe[childId].parents?.filter(
                (id) => id !== track.id,
              );
          });
        }

        if (track.parents) {
          track.parents.forEach((parentId) => {
            if (tracksDupe[parentId])
              tracksDupe[parentId].children = tracksDupe[
                parentId
              ].children?.filter((id) => id !== track.id);
          });
        }

        delete tracksDupe[track.id];
      }
    });

    return Object.values(tracksDupe);
  }

  _consolidateTracklets(tracklets: Record<string, PendingTracklet>) {
    const removedTracklets: string[] = [];
    const trackletIdSet = new Set(Object.keys(tracklets));

    trackletIdSet.forEach((id) => {
      const track = tracklets[id];
      if (track.children && track.children.length === 1) {
        const child = tracklets[track.children[0]];
        if (child.parents && child.parents.length === 1) {
          // add linkedIds to root tracklet
          mutatingFilter(track.children, (id) => id !== child.id);
          track.linkedIds.push(...child.linkedIds);
          if (child.children) {
            // add the grandchildren to the parents children array
            track.children = child.children;
            child.children.forEach((grandchildId) => {
              const grandchild = tracklets[grandchildId];
              // replace the parent with the grandparent

              mutatingFilter(grandchild.parents!, (id) => id !== child.id);
              grandchild.parents!.push(track.id);
            });
          }
          trackletIdSet.delete(child.id);
          delete tracklets[child.id];
          removedTracklets.push(child.id);
        }
      }
    });
    return tracklets;
  }

  _groupByKind(annotations: DecodedAnnotationObject[], kind: string) {
    const groupedByKind: Record<
      string,
      Record<string, DecodedAnnotationObject>
    > = {};
    if (kind === "All") {
      annotations.forEach((annotation) => {
        if (groupedByKind[annotation.kind]) {
          groupedByKind[annotation.kind][annotation.id] = annotation;
        } else {
          groupedByKind[annotation.kind] = { [annotation.id]: annotation };
        }
      });
    } else {
      groupedByKind[kind] = {};
      annotations.forEach((annotation) => {
        if (annotation.kind !== kind) return;
        groupedByKind[kind][annotation.id] = annotation;
      });
    }
    return groupedByKind;
  }

  /**
   * Processes annotations frame-by-frame, linking them based on center-of-mass proximity
   * @returns Array of tracklets (optionally filtered to exclude single-frame tracks)
   */
  computeTracks(
    annotations: Record<string, DecodedAnnotationObject>,
    kinds: string,
    annotationCOMs?: Record<string, CenterOfMass>,
  ): {
    tracks: Array<Tracklet>;
    coms: Record<string, CenterOfMass>;
  } {
    const results: {
      tracks: Array<Tracklet>;
      coms: Record<string, CenterOfMass>;
    } = { tracks: [], coms: {} };

    const groupedByKind = this._groupByKind(Object.values(annotations), kinds);

    Object.values(groupedByKind).forEach((groupedAnnotations) => {
      const orderedAnnotations = createOrderedAnnotationRecord(
        groupedAnnotations,
        this.config.numFrames,
      );
      const tracks: Record<string, PendingTracklet> = {};
      const ann2TrackId: Record<string, string> = {};
      const initializedChildren: Record<string, PendingTracklet> = {};

      // Pre-compute centers of mass for all annotations
      const centersOfMassRecord: Record<string, CenterOfMass> = {};
      Object.values(groupedAnnotations).forEach((ann) => {
        if (annotationCOMs && annotationCOMs[ann.id]) {
          centersOfMassRecord[ann.id] = annotationCOMs[ann.id];
          return;
        }
        const width = ann.boundingBox[2] - ann.boundingBox[0];
        const { x, y } = calculateCenterOfMass(ann.decodedMask, width);

        centersOfMassRecord[ann.id] = {
          annotationId: ann.id,
          x: x + ann.boundingBox[0],
          y: y + ann.boundingBox[1],
        };
      });

      const finalizeTracklet = (annotation: DecodedAnnotationObject) => {
        if (!currentTracklet) return;
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
                console.error("No child found in initialized record");
              } else {
                delete initializedChildren[initChildEntry[0]];
              }
            });
          }
          if (currentTracklet.parents) {
            currentTracklet.parents.forEach((parentId) => {
              const parent = tracks[parentId];
              if (!parent) {
                console.error("No parent tracklet found");
              } else if (!parent.children) {
                console.error("Parent has no children");
              } else {
                parent.children = parent.children?.filter(
                  (id) => id !== currentTracklet?.id,
                );
              }
            });
          }
        } else {
          tracks[currentTracklet.id] = currentTracklet;
        }
        currentTracklet = undefined;
      };

      // Process timepoints sequentially
      let i = 0;
      let trackNumber = 1;
      let nextTimepoint;
      let currentTracklet: PendingTracklet | undefined;
      while (i < orderedAnnotations.length - 1) {
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
            console.error("could not find annotation center of mass");
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
                name: `Tracklet-${trackNumber++}`,
                metadataId: this.config.imageMetadataId,
                start: currentAnnotation.timepoint,
                linkedIds: [currentAnnotation.id],
                color: getRestrictedRandomHexColor({
                  similarity: { baseColor: "#FBB904", minDifference: 20 },
                }),
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
            // terminateAndAddTracklet() ->
            //   nextTimepoint = i + 1;
            //   currentTracklet.end = currentAnnotation.timepoint;
            //   tracks[currentTracklet.trackId] = currentTracklet;
            //   currentTracklet = undefined;
            finalizeTracklet(currentAnnotation);

            continue;
          }

          let gapClosingCounter = 0;
          const gapClosingDist = this.config.gapClosingDist ?? 0;
          let nearestNeighbor: NearestNeighborResult | undefined = undefined;
          let nextAnnotations: Record<string, DecodedAnnotationObject> = {};
          while (
            gapClosingCounter <= gapClosingDist &&
            nearestNeighbor === undefined &&
            nextTimepoint + gapClosingCounter < orderedAnnotations.length
          ) {
            const gapTimepoint = nextTimepoint + gapClosingCounter;
            // Create a list of potential linked anns excluding those already in a tracklet or those which will become child tracklets
            nextAnnotations = orderedAnnotations[gapTimepoint];
            const candidateAnns = Object.values(nextAnnotations).filter(
              (ann) => !ann2TrackId[ann.id] && !(ann.id in initializedChildren),
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

          if (nearestNeighbor) {
            // if there are multiple nearest neighbors:
            // - create child trackletss if specified,
            // - otherwise do not add to current tracklet
            if (nearestNeighbor.targetId.length > 1) {
              // Handle split/division
              if (this.config.calculateTrackletRelationships) {
                // create pre-initialized tracklets for children, will be used when associated annotation is visited
                let childIndex = 1;
                for (const id of nearestNeighbor.targetId) {
                  const childAnn = nextAnnotations[id];

                  // create child tracklet
                  const childTracklet = {
                    id: generateUUID(),
                    name: currentTracklet.name + `.${childIndex}`,
                    metadataId: this.config.imageMetadataId,
                    start: childAnn.timepoint,
                    linkedIds: [id],
                    parents: [currentTracklet.id],
                    color: getRestrictedRandomHexColor({
                      similarity: { baseColor: "#FBB904", minDifference: 20 },
                    }),
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
            } else {
              // Add annotation to be visited on next iteration
              timepointAnnotations.push(
                nextAnnotations[nearestNeighbor.targetId[0]],
              );
              nextTimepoint++;
              continue;
            }
          }

          // EXIT CASE: 0 NNs or 2+ NNs without child creation
          finalizeTracklet(currentAnnotation);
        }

        i++;
      }

      // Finalize any unextended child tracklets

      if (Object.keys(initializedChildren).length > 0) {
        Object.values(initializedChildren).forEach((child) => {
          if (this.config.includeIsolatedAnnotations) {
            tracks[child.id] = { ...child, end: child.start };
          } else {
            const parentIds = child.parents;
            if (parentIds) {
              parentIds.forEach((id) => {
                tracks[id].children = tracks[id].children?.filter(
                  (childId) => childId !== child.id,
                );
              });
            }
          }
        });
      }

      this._consolidateTracklets(tracks);
      if (this._validateTracks(tracks)) {
        results.tracks.push(...(Object.values(tracks) as Array<Tracklet>));
        Object.assign(results.coms, centersOfMassRecord);
      }
    });
    return results;
  }
}
