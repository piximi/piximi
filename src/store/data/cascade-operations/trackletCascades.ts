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
  trackletIds: string[],
) => {
  let firstTracklet: Tracklet | undefined;
  let lastTracklet: Tracklet | undefined;

  // Find the earliest and latest tracklets, along with the tracklets in between
  trackletIds.forEach((trackletId) => {
    const tracklet = state.tracklets.entities[trackletId];
    if (!firstTracklet || tracklet.start < firstTracklet.start) {
      firstTracklet = tracklet;
    }
    if (!lastTracklet || tracklet.end > lastTracklet.end) {
      lastTracklet = tracklet;
    }
  });
  if (!firstTracklet || !lastTracklet) return;

  // create a list of the tracklet entities excluding the first and last
  const middleTracklets = trackletIds
    .filter((id) => id !== firstTracklet!.id && id !== lastTracklet!.id)
    .map((id) => state.tracklets.entities[id]);

  const newTracklet: Tracklet = {
    id: generateUUID(),
    metadataId: firstTracklet.metadataId,
    color: getRandomHexColor(),
    start: Infinity,
    end: 0,
    linkedIds: [] as string[],
  };

  // Add initial tracklet
  addTrackletCascade(state, newTracklet);

  //
  // link Ids from the first tracklet to the new one
  firstTracklet.linkedIds.forEach((annId) =>
    addAnnotationToTrackletCascade(state, newTracklet.id, annId),
  );

  // If the first tracklet has parents, transfer the relationships to the new tracklet
  if (firstTracklet.parents)
    firstTracklet.parents.forEach((parentId) => {
      removeTrackletRelationship(state, parentId, firstTracklet!.id);
      addTrackletRelationship(state, parentId, newTracklet.id);
    });

  for (const tracklet of middleTracklets) {
    // Add each of the middle tracklets linked annotations to the primary tracklet
    tracklet.linkedIds.forEach((annId) =>
      addAnnotationToTrackletCascade(state, newTracklet.id, annId),
    );

    // If any of the middle tracklets have relationships with tracklets other than those selected for joining
    // remove the relationships (we dont care about relationships with eachother since theyll be deleted)
    if (tracklet.parents)
      tracklet.parents.forEach(
        (parentId) =>
          !trackletIds.includes(parentId) &&
          removeTrackletRelationship(state, parentId, tracklet.id),
      );
    if (tracklet.id === lastTracklet.id) continue;
    if (tracklet.children)
      tracklet.children.forEach(
        (childId) =>
          !trackletIds.includes(childId) &&
          removeTrackletRelationship(state, tracklet.id, childId),
      );
  }
  // link Ids from the last tracklet to the new one
  lastTracklet.linkedIds.forEach((annId) =>
    addAnnotationToTrackletCascade(state, newTracklet.id, annId),
  );

  // If the last tracklet has children, transfer the relationships to the new tracklet
  if (lastTracklet.children)
    lastTracklet.children.forEach((childId) => {
      removeTrackletRelationship(state, lastTracklet!.id, childId);
      addTrackletRelationship(state, newTracklet.id, childId);
    });

  trackletIds.forEach((trackletId) =>
    removeTrackletFromMetadataRelationship(
      state,
      trackletId,
      state.tracklets.entities[trackletId].metadataId,
    ),
  );
  // Remove all the joined tracklets
  trackletAdapter.removeMany(state.tracklets, trackletIds);
};

export const severTrackletCascade = (
  state: WritableDraft<DataState>,
  trackletId: string,
  timepoint: number,
) => {
  const tracklet = state.tracklets.entities[trackletId];
  if (!tracklet || !isPopulatedTracklet(tracklet)) {
    console.error(`tracklet with id '${trackletId} could not be found.`);
    return;
  }
  if (timepoint <= tracklet.start || timepoint >= tracklet.end) return;
  const leftTracklet: Tracklet = {
    id: generateUUID(),
    metadataId: tracklet.metadataId,
    color: getRandomHexColor(),
    start: Infinity,
    end: 0,
    linkedIds: [] as string[],
  };
  addTrackletCascade(state, leftTracklet);
  const rightTracklet: Tracklet = {
    id: generateUUID(),
    metadataId: tracklet.metadataId,
    color: getRandomHexColor(),
    start: Infinity,
    end: 0,
    linkedIds: [] as string[],
  };
  addTrackletCascade(state, rightTracklet);
  tracklet.linkedIds.forEach((id) => {
    const ann = state.annotations.entities[id];
    if (!ann) {
      console.error(`could not find annotation with id '${id}'`);
      return;
    }
    if (ann.timepoint < timepoint)
      addAnnotationToTrackletCascade(state, leftTracklet.id, id);
    else addAnnotationToTrackletCascade(state, rightTracklet.id, id);
  });

  if (tracklet.parents)
    tracklet.parents.forEach((parentId) => {
      removeTrackletRelationship(state, parentId, tracklet.id);
      addTrackletRelationship(state, parentId, leftTracklet.id);
    });

  if (tracklet.children)
    tracklet.children.forEach((childId) => {
      removeTrackletRelationship(state, tracklet.id, childId);
      addTrackletRelationship(state, rightTracklet.id, childId);
    });

  removeTrackletFromMetadataRelationship(
    state,
    trackletId,
    tracklet.metadataId,
  );
  trackletAdapter.removeOne(state.tracklets, trackletId);
};
