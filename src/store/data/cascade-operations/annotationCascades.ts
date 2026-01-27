import { annotationsAdapter } from "../dataSlice";
import {
  reassignAnnotationToCategoryRelationship,
  reassignAnnotationToKindRelationship,
  removeAnnotationFromAllRelationships,
} from "../relationship-operations/annotationOperations";
import { removeAnnotationFromTrackletCascade } from "./trackletCascades";
import { DataState } from "store/types";
import { WritableDraft } from "immer";
import { AnnotationObject } from "../types";

/**
 * Cascading delete for an annotation
 * Handles all relationship cleanup and tracklet unlinking atomically
 */
export const deleteAnnotationCascade = (
  state: WritableDraft<DataState>,
  annId: string,
): void => {
  const annotation = state.annotations.entities[annId];

  if (!annotation) return;

  // Step 1: Remove from all relationship indexes
  removeAnnotationFromAllRelationships(state, annId);

  // Step 2: Handle tracklet cleanup if linked
  if (annotation.trackId) {
    removeAnnotationFromTrackletCascade(state, annotation.trackId, annId);
  }
  annotation.data.dispose();
  // Step 3: Delete the annotation entity
  annotationsAdapter.removeOne(state.annotations, annId);
};

export const updateAnnotationCascade = (
  state: WritableDraft<DataState>,
  annId: string,
  changes: Partial<
    Omit<
      AnnotationObject,
      "id" | "bitDepth" | "plane" | "imageId" | "timepoint"
    >
  >,
) => {
  const existingAnnotation = state.annotations.entities[annId];

  if (!existingAnnotation) return;

  // Handle category change
  if (
    changes.categoryId &&
    changes.categoryId !== existingAnnotation.categoryId
  ) {
    reassignAnnotationToCategoryRelationship(state, annId, changes.categoryId);
  }

  // Handle kind change
  if (changes.kind && changes.kind !== existingAnnotation.kind) {
    reassignAnnotationToKindRelationship(state, annId, changes.kind);
  }

  annotationsAdapter.updateOne(state.annotations, { id: annId, changes });
};
