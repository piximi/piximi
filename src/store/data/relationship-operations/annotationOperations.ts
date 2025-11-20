import { WritableDraft } from "immer";
import { DataState } from "store/types";
import {
  addToSimpleRelationship,
  removeFromSimpleRelationship,
} from "utils/objectUtils";

// Addition Operations
export const addAnnotationToImageRelationship = (
  state: WritableDraft<DataState>,
  annotationId: string,
  imageId: string,
) => {
  if (
    !state.annotations.entities[annotationId] ||
    !state.images.entities[imageId]
  )
    return;
  addToSimpleRelationship(
    state.relationships.imageToAnnotations,
    imageId,
    annotationId,
  );
};

export const addAnnotationToCategoryRelationship = (
  state: WritableDraft<DataState>,
  annotationId: string,
  categoryId: string,
) => {
  if (
    !state.annotations.entities[annotationId] ||
    !state.categories.entities[categoryId]
  )
    return;
  addToSimpleRelationship(
    state.relationships.categoryToAnnotations,
    categoryId,
    annotationId,
  );
};

export const addAnnotationToKindRelationship = (
  state: WritableDraft<DataState>,
  annotationId: string,
  kindId: string,
) => {
  if (
    !state.annotations.entities[annotationId] ||
    !state.kinds.entities[kindId]
  )
    return;
  addToSimpleRelationship(
    state.relationships.kindToAnnotations,
    kindId,
    annotationId,
  );
};

export const addAnnotationToAllRelationships = (
  state: WritableDraft<DataState>,
  annotationId: string,
  relations: { kindId: string; categoryId: string; imageId: string },
) => {
  const { kindId, categoryId, imageId } = relations;

  addAnnotationToKindRelationship(state, annotationId, kindId);
  addAnnotationToCategoryRelationship(state, annotationId, categoryId);
  addAnnotationToImageRelationship(state, annotationId, imageId);
};

// Removal Operations
export const removeAnnotationFromImageRelationship = (
  state: WritableDraft<DataState>,
  annotationId: string,
) => {
  const annotation = state.annotations.entities[annotationId];
  if (
    !annotation ||
    !state.relationships.imageToAnnotations[annotation.imageId]
  )
    return;
  removeFromSimpleRelationship(
    state.relationships.imageToAnnotations,
    annotation.imageId,
    annotation.id,
  );
};

export const removeAnnotationFromCategoryRelationship = (
  state: WritableDraft<DataState>,
  annotationId: string,
) => {
  const annotation = state.annotations.entities[annotationId];
  if (
    !annotation ||
    !state.relationships.categoryToAnnotations[annotation.categoryId]
  )
    return;
  removeFromSimpleRelationship(
    state.relationships.categoryToAnnotations,
    annotation.categoryId,
    annotation.id,
  );
};

export const removeAnnotationFromKindRelationship = (
  state: WritableDraft<DataState>,
  annotationId: string,
) => {
  const annotation = state.annotations.entities[annotationId];
  if (!annotation || !state.relationships.kindToAnnotations[annotation.kind])
    return;
  removeFromSimpleRelationship(
    state.relationships.kindToAnnotations,
    annotation.kind,
    annotation.id,
  );
};

export const removeAnnotationFromAllRelationships = (
  state: WritableDraft<DataState>,
  annotationId: string,
) => {
  removeAnnotationFromKindRelationship(state, annotationId);
  removeAnnotationFromCategoryRelationship(state, annotationId);
  removeAnnotationFromImageRelationship(state, annotationId);
};

// Reassignment Operations

export const reassignAnnotationToCategoryRelationship = (
  state: WritableDraft<DataState>,
  annotationId: string,
  newCategoryId: string,
) => {
  if (
    !state.annotations.entities[annotationId] ||
    !state.categories.entities[newCategoryId]
  )
    return;
  removeAnnotationFromCategoryRelationship(state, annotationId);
  addAnnotationToCategoryRelationship(state, annotationId, newCategoryId);
};

export const reassignAnnotationToKindRelationship = (
  state: WritableDraft<DataState>,
  annotationId: string,
  newKindId: string,
) => {
  if (
    !state.annotations.entities[annotationId] ||
    !state.kinds.entities[newKindId]
  )
    return;
  removeAnnotationFromKindRelationship(state, annotationId);
  addAnnotationToKindRelationship(state, annotationId, newKindId);
};
