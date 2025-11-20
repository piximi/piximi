import { WritableDraft } from "immer";
import { mutatingFilter } from "utils/arrayUtils";
import {
  addToSimpleRelationship,
  removeFromSimpleRelationship,
} from "utils/objectUtils";
import { DataState } from "store/types";

export const removeTrackletRelationship = (
  state: WritableDraft<DataState>,
  parentId: string,
  childId: string,
) => {
  const parentTracklet = state.tracklets.entities[parentId];
  const childTracklet = state.tracklets.entities[childId];
  if (!parentTracklet || !childTracklet) return;
  parentTracklet.children &&
    mutatingFilter(parentTracklet.children, (id) => id !== childId);

  childTracklet.parents &&
    mutatingFilter(childTracklet.parents, (id) => id !== parentId);
};

export const addTrackletRelationship = (
  state: WritableDraft<DataState>,
  parentId: string,
  childId: string,
) => {
  const parentTracklet = state.tracklets.entities[parentId];
  const childTracklet = state.tracklets.entities[childId];
  if (!parentTracklet || !childTracklet) return;
  parentTracklet.children
    ? parentTracklet.children.push(childId)
    : (parentTracklet.children = [childId]);

  childTracklet.parents
    ? childTracklet.parents.push(parentId)
    : (childTracklet.parents = [parentId]);
};

export const addTrackletToMetadataRelationship = (
  state: WritableDraft<DataState>,
  trackletId: string,
  metadataId: string,
) => {
  if (
    !state.tracklets.entities[trackletId] ||
    !state.metadata.entities[metadataId]
  )
    return;
  // Initialize array if it doesn't exist
  addToSimpleRelationship(
    state.relationships.metadataToTracklets,
    metadataId,
    trackletId,
  );
};
/**
 * Removes tracklet from metadata relationship index
 */
export const removeTrackletFromMetadataRelationship = (
  state: WritableDraft<DataState>,
  trackId: string,
  metadataId: string,
): void => {
  removeFromSimpleRelationship(
    state.relationships.metadataToTracklets,
    metadataId,
    trackId,
  );
};
