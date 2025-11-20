import { WritableDraft } from "immer";
import { DataState } from "store/types";
import { isUnknownCategory } from "../utils";
import { IMAGE_KIND } from "../constants";
import {
  annotationsAdapter,
  categoriesAdapter,
  imageDataAdapter,
} from "../dataSlice";
import { reassignImageToCategoryRelationship } from "../relationship-operations/imageOperations";
import { reassignAnnotationToCategoryRelationship } from "../relationship-operations/annotationOperations";
import {
  addCategoryToKindRelationship,
  removeCategoryFromKindRelationship,
} from "../relationship-operations/categoryOperations";
import { Category } from "../types";

export const addCategoryCascade = (
  state: WritableDraft<DataState>,
  category: Category,
) => {
  if (isUnknownCategory(category.id)) {
    console.error("Cannot directly create unknown category.");
    return;
  }
  categoriesAdapter.addOne(state.categories, category);

  // Initialize relationship entries
  if (category.kind === IMAGE_KIND)
    state.relationships.categoryToImages[category.id] = [];
  else state.relationships.categoryToAnnotations[category.id] = [];

  // Update kind relationship
  addCategoryToKindRelationship(state, category.id, category.kind);
};
export const deleteCategoryCascade = (
  state: WritableDraft<DataState>,
  categoryId: string,
) => {
  if (isUnknownCategory(categoryId)) {
    console.error("Cannot remove unknown Category");
    return;
  }
  const category = state.categories.entities[categoryId];

  if (!category) return;

  // Update all images that use this category to use unknown category
  const kind = state.kinds.entities[category.kind];
  const unknownCategoryId = kind.unknownCategoryId;
  if (kind.id === IMAGE_KIND) {
    const imageIds = state.relationships.categoryToImages[categoryId] || [];
    imageIds.forEach((imageId) => {
      // Update image entity
      imageDataAdapter.updateOne(state.images, {
        id: imageId,
        changes: { categoryId: unknownCategoryId },
      });
      // Update relationships
      reassignImageToCategoryRelationship(state, imageId, unknownCategoryId);
    });
    // Clean up relationships
    delete state.relationships.categoryToImages[categoryId];
  } else {
    const annIds = state.relationships.categoryToAnnotations[categoryId] || [];
    annIds.forEach((annId) => {
      // Update annotation entity
      annotationsAdapter.updateOne(state.annotations, {
        id: annId,
        changes: { categoryId: unknownCategoryId },
      });
      // Update relationships
      reassignAnnotationToCategoryRelationship(state, annId, unknownCategoryId);
    });
    // Clean up relationships

    delete state.relationships.categoryToAnnotations[categoryId];
  }

  // Remove from kind relationship
  removeCategoryFromKindRelationship(state, categoryId);

  // Delete the category
  categoriesAdapter.removeOne(state.categories, categoryId);
};
