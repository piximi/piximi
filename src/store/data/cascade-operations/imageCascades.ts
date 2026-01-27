import { WritableDraft } from "immer";
import { DataState } from "store/types";
import { deleteAnnotationCascade } from "./annotationCascades";
import {
  reassignImageToCategoryRelationship,
  removeImageFromCategoryRelationship,
} from "../relationship-operations/imageOperations";
import { imageDataAdapter, metadataAdapter } from "../dataSlice";
import { mutatingFilter } from "utils/arrayUtils";
import { ImageObject } from "../types";

export const deleteImageCascade = (
  state: WritableDraft<DataState>,
  imageId: string,
) => {
  const image = state.images.entities[imageId];
  if (!image) return;
  // Delete all annotations for this image
  const annotationIds = state.relationships.imageToAnnotations[imageId];
  annotationIds.forEach((annId) => {
    deleteAnnotationCascade(state, annId);
  });

  // Remove from category relationships
  removeImageFromCategoryRelationship(state, imageId);

  image.data.dispose();

  // Clean up relationships
  delete state.relationships.imageToAnnotations[imageId];

  // Delete the image
  imageDataAdapter.removeOne(state.images, imageId);

  // Remove from metadata and delete metadata if no images
  const metadata = state.metadata.entities[image.metadataId];
  mutatingFilter(metadata.imageDataIds, (id) => id !== imageId);
  if (metadata.imageDataIds.length === 0) {
    metadataAdapter.removeOne(state.metadata, metadata.id);
  } else {
    if (metadata.defaultImageId === imageId)
      metadata.defaultImageId = metadata.imageDataIds[0];
  }
};

export const updateImageCascade = (
  state: WritableDraft<DataState>,
  imageId: string,
  changes: Partial<Omit<ImageObject, "data">>,
) => {
  const existingImageData = state.images.entities[imageId];

  if (!existingImageData) return;

  if (changes.categoryId) {
    reassignImageToCategoryRelationship(state, imageId, changes.categoryId);
  }

  imageDataAdapter.updateOne(state.images, { id: imageId, changes });
};
