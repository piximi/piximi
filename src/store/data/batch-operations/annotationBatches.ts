import { WritableDraft } from "immer";
import { AnnotationObject } from "../types";
import { DataState } from "store/types";
import { annotationsAdapter } from "../dataSlice";
import {
  addAnnotationToAllRelationships,
  removeAnnotationFromAllRelationships,
} from "../relationship-operations/annotationOperations";
import { removeAnnotationFromTrackletCascade } from "../cascade-operations/trackletCascades";
import { updateAnnotationCascade } from "../cascade-operations/annotationCascades";

export const addAnnotationBatch = (
  state: WritableDraft<DataState>,
  annotations: AnnotationObject[],
) => {
  annotationsAdapter.addMany(state.annotations, annotations);

  annotations.forEach((annotation) => {
    addAnnotationToAllRelationships(state, annotation.id, {
      kindId: annotation.kind,
      categoryId: annotation.categoryId,
      imageId: annotation.imageId,
    });
  });
};

export const deleteAnnotationBatch = (
  state: WritableDraft<DataState>,
  annotationIds: string[],
) => {
  annotationIds.forEach((annotationId) => {
    const annotation = state.annotations.entities[annotationId];
    if (annotation) {
      removeAnnotationFromAllRelationships(state, annotationId);

      // Clean up link graph
      if (annotation.trackId) {
        removeAnnotationFromTrackletCascade(
          state,
          annotation.trackId,
          annotation.id,
        );
      }
    }
  });

  annotationsAdapter.removeMany(state.annotations, annotationIds);
};

export const updateAnnotationBatch = (
  state: WritableDraft<DataState>,
  batchChanges: {
    id: string;
    changes: Partial<
      Omit<
        AnnotationObject,
        "id" | "bitDepth" | "plane" | "imageId" | "timepoint"
      >
    >;
  }[],
) => {
  batchChanges.forEach(({ id, changes }) => {
    updateAnnotationCascade(state, id, changes);
  });
};
