import { WritableDraft } from "immer";
import { DataState } from "store/types";
import {
  addToSimpleRelationship,
  removeFromSimpleRelationship,
} from "utils/objectUtils";

// Addition Operations

export const addImageToCategoryRelationship = (
  state: WritableDraft<DataState>,
  imageId: string,
  categoryId: string,
) => {
  if (!state.images.entities[imageId] || !state.categories.entities[categoryId])
    return;
  addToSimpleRelationship(
    state.relationships.categoryToImages,
    categoryId,
    imageId,
  );
};

// Removal Operations

export const removeImageFromCategoryRelationship = (
  state: WritableDraft<DataState>,
  imageId: string,
) => {
  const image = state.images.entities[imageId];
  if (!image || !state.relationships.categoryToImages[image.categoryId]) return;
  removeFromSimpleRelationship(
    state.relationships.categoryToImages,
    image.categoryId,
    image.id,
  );
};

// Reassignment Operations

export const reassignImageToCategoryRelationship = (
  state: WritableDraft<DataState>,
  imageId: string,
  newCategoryId: string,
) => {
  if (
    !state.images.entities[imageId] ||
    !state.categories.entities[newCategoryId]
  )
    return;
  removeImageFromCategoryRelationship(state, imageId);
  addImageToCategoryRelationship(state, imageId, newCategoryId);
};
