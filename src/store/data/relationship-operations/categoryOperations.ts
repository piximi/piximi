import { WritableDraft } from "immer";
import { DataState } from "store/types";
import {
  addToSimpleRelationship,
  removeFromSimpleRelationship,
} from "utils/objectUtils";

// Addition Operations
export const addCategoryToKindRelationship = (
  state: WritableDraft<DataState>,
  categoryId: string,
  kindId: string,
) => {
  if (!state.categories.entities[categoryId] || !state.kinds.entities[kindId])
    return;
  addToSimpleRelationship(
    state.relationships.kindToCategories,
    kindId,
    categoryId,
  );
};

// Removal Operations
export const removeCategoryFromKindRelationship = (
  state: WritableDraft<DataState>,
  categoryId: string,
) => {
  const category = state.categories.entities[categoryId];
  if (!category || !state.relationships.kindToCategories[category.kind]) return;
  removeFromSimpleRelationship(
    state.relationships.kindToCategories,
    category.kind,
    category.id,
  );
};
