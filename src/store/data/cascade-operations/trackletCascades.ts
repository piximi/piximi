import { WritableDraft } from "immer";
import {
  removeTrackletRelationship,
  removeTrackletFromMetadataRelationship,
  addTrackletToMetadataRelationship,
  addTrackletRelationship,
} from "../relationship-operations/trackletOperations";
import { DataState } from "store/types";
import { mutatingFilter } from "utils/arrayUtils";
import { Tracklet } from "../types";
import { annotationsAdapter, trackletAdapter } from "../dataSlice";
import { generateUUID, isPopulatedTracklet } from "../utils";
import { getRandomHexColor } from "utils/colorUtils";

export const addTrackletCascade = (
  state: WritableDraft<DataState>,
  tracklet: Tracklet,
) => {
  trackletAdapter.addOne(state.tracklets, tracklet);
  // Initialize array if it doesn't exist
  addTrackletToMetadataRelationship(state, tracklet.id, tracklet.metadataId);
  // Update all linked annotations with trackId
  if (tracklet.linkedIds && tracklet.linkedIds.length > 0) {
    annotationsAdapter.updateMany(
      state.annotations,
      tracklet.linkedIds.map((annId) => ({
        id: annId,
        changes: { trackId: tracklet.id },
      })),
    );
  }
};

/**
 * Performs all cascading updates when deleting a tracklet
 * This ensures atomicity - all related entities are updated in one reducer invocation
 *
 * Order of operations:
 * 1. Clear annotation.trackId references
 * 2. Remove from parent/child tracklet relationships
 * 3. Remove from metadata index
 * 4. Delete the tracklet entity
 */
export const deleteTrackletCascade = (
  state: WritableDraft<DataState>,
  trackletId: string,
): void => {
  const tracklet = state.tracklets.entities[trackletId];

  if (!tracklet) {
    console.error(`Tracklet with id "${trackletId}" does not exist`);
    return;
  }

  // Step 1: Clear references from annotations
  annotationsAdapter.updateMany(
    state.annotations,
    tracklet.linkedIds.map((annId) => ({
      id: annId,
      changes: { trackId: undefined },
    })),
  );

  // Step 2: Remove from parent/child relationships
  if (tracklet.children)
    tracklet.children.forEach((childId) =>
      removeTrackletRelationship(state, trackletId, childId),
    );
  if (tracklet.parents)
    tracklet.parents.forEach((parentId) =>
      removeTrackletRelationship(state, parentId, trackletId),
    );

  // Step 3: Remove from metadata relationship
  removeTrackletFromMetadataRelationship(
    state,
    trackletId,
    tracklet.metadataId,
  );

  // Step 4: Delete the tracklet entity
  trackletAdapter.removeOne(state.tracklets, trackletId);
};

export const addAnnotationToTrackletCascade = (
  state: WritableDraft<DataState>,
  trackletId: string,
  annId: string,
) => {
  const annotation = state.annotations.entities[annId];

  const tracklet = state.tracklets.entities[trackletId];
  if (!tracklet) return;
  // return if annotation already part of tracklet
  if (tracklet.linkedIds.includes(annId)) {
    console.error(`Annotation with id "${annId}" already part of track`);
    return;
  }

  // Check to see if there is already an annotation at the same timepoint in the tracklet
  // if there is, dont add the annotation
  const existingAnnAtTimepoint = tracklet.linkedIds.find((annId) => {
    const ann = state.annotations.entities[annId];
    return ann.timepoint === annotation.timepoint;
  });

  if (existingAnnAtTimepoint) {
    return;
  }

  // add annotation to tracklet and update start/end if necessary
  tracklet.linkedIds.push(annId);
  if (tracklet.start === undefined || tracklet.start > annotation.timepoint)
    tracklet.start = annotation.timepoint;
  if (tracklet.end === undefined || tracklet.end < annotation.timepoint)
    tracklet.end = annotation.timepoint;

  //update trackId of annotation
  annotationsAdapter.updateOne(state.annotations, {
    id: annId,
    changes: { trackId: trackletId },
  });
};

export const removeAnnotationFromTrackletCascade = (
  state: WritableDraft<DataState>,
  trackletId: string,
  annId: string,
) => {
  const tracklet = state.tracklets.entities[trackletId];
  if (!tracklet) {
    console.error(`tracklet with id "${trackletId}" does not exist`);
    return;
  }

  mutatingFilter(tracklet.linkedIds, (id) => id !== annId);
  const annotation = state.annotations.entities[annId];
  const removedTP = annotation.timepoint;
  annotation.trackId = undefined;

  if (tracklet.linkedIds.length === 0) {
    deleteTrackletCascade(state, trackletId);
    return;
  }

  if (tracklet.start === removedTP || tracklet.end === removedTP) {
    const newLimits = tracklet.linkedIds.reduce(
      (newLimits: { start: number; end: number }, annId) => {
        const tp = state.annotations.entities[annId].timepoint;
        if (tp < newLimits.start) newLimits.start = tp;
        if (tp > newLimits.end) newLimits.end = tp;
        return newLimits;
      },
      { start: tracklet.start, end: tracklet.end },
    );
    tracklet.start = newLimits.start;
    tracklet.end = newLimits.end;
  }
};

export const joinTrackletsCascade = (
  state: WritableDraft<DataState>,
  primaryTrackletId: string,
  joinedTrackletId: string,
) => {
  const primaryTracklet = state.tracklets.entities[primaryTrackletId];
  const joinedTracklet = state.tracklets.entities[joinedTrackletId];

  if (!primaryTracklet || !joinedTracklet) {
    console.error("One or more tracklets do not exist");
    return;
  }
  if (primaryTracklet.children) {
    console.error("Cannot join if primary tracklet has children.");
  }
  if (joinedTracklet.parents) {
    console.error("Cannot join if joining tracklet has parents.");
  }

  joinedTracklet.linkedIds.forEach(
    (id) => (state.annotations.entities[id].trackId = primaryTracklet.id),
  );
  primaryTracklet.linkedIds.push(...joinedTracklet.linkedIds);
  primaryTracklet.end = joinedTracklet.end;

  if (joinedTracklet.children) {
    const joinedTrackletChildren = [...joinedTracklet.children];
    joinedTrackletChildren.forEach((childId) => {
      removeTrackletRelationship(state, joinedTracklet.id, childId);
      addTrackletRelationship(state, primaryTracklet.id, childId);
    });
  }

  removeTrackletFromMetadataRelationship(
    state,
    joinedTrackletId,
    joinedTracklet.metadataId,
  );
  // Remove all the joined tracklets
  trackletAdapter.removeOne(state.tracklets, joinedTrackletId);
};

export const severTrackletCascade = (
  state: WritableDraft<DataState>,
  trackletId: string,
  severPoint: number,
) => {
  const originalTracklet = state.tracklets.entities[trackletId];
  if (!originalTracklet || !isPopulatedTracklet(originalTracklet)) {
    console.error(`tracklet with id '${trackletId} could not be found.`);
    return;
  }
  if (
    severPoint <= originalTracklet.start ||
    severPoint >= originalTracklet.end
  )
    return;

  const severedTracklet: Tracklet = {
    id: generateUUID(),
    metadataId: originalTracklet.metadataId,
    color: getRandomHexColor(),
    start: 0,
    end: originalTracklet.end,
    linkedIds: [] as string[],
  };
  addTrackletCascade(state, severedTracklet);

  // split annotations and add to the respective tracklets
  const remainingTrackletAnns: string[] = [];
  const severedTrackletAnns: string[] = [];

  // need to calculate new starts and ends in case split takes place at gap
  let remainingEnd = 0;
  let severedStart = Infinity;
  let severedEnd = 0;

  originalTracklet.linkedIds.forEach((id) => {
    const ann = state.annotations.entities[id];
    if (!ann) {
      console.error(`could not find annotation with id '${id}'`);
      return;
    }

    if (ann.timepoint < severPoint) {
      remainingTrackletAnns.push(id);
      if (ann.timepoint > remainingEnd) remainingEnd = ann.timepoint;
    } else {
      severedTrackletAnns.push(id);
      state.annotations.entities[id].trackId = severedTracklet.id;
      if (ann.timepoint > severedEnd) severedEnd = ann.timepoint;
      if (ann.timepoint < severedStart) severedStart = ann.timepoint;
    }
  });

  originalTracklet.linkedIds = remainingTrackletAnns;
  originalTracklet.end = remainingEnd;

  severedTracklet.linkedIds = severedTrackletAnns;
  severedTracklet.start = severedStart;
  severedTracklet.end = severedEnd;

  // if the original tracklet has children, remove them from the original and add to the severed

  if (originalTracklet.children) {
    const originalTrackletChildren = [...originalTracklet.children];
    originalTrackletChildren.forEach((childId) => {
      removeTrackletRelationship(state, originalTracklet.id, childId);
      addTrackletRelationship(state, severedTracklet.id, childId);
    });
  }
};
