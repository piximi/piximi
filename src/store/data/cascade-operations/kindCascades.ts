import { WritableDraft } from "immer";
import { DataState } from "store/types";
import { deleteAnnotationCascade } from "./annotationCascades";
import { deleteCategoryCascade } from "./categoryCascades";
import { categoriesAdapter, kindsAdapter } from "../dataSlice";
import { Category, Kind } from "../types";
import {
  IMAGE_KIND,
  UNKNOWN_ANNOTATION_CATEGORY_COLOR,
  UNKNOWN_CATEGORY_NAME,
} from "../constants";
import { generateCategory } from "../utils";

export const addKindCascade = (
  state: WritableDraft<DataState>,
  kind: Kind,
  unknownCategory?: Category,
) => {
  if (kind.id === IMAGE_KIND && state.kinds.entities[IMAGE_KIND]) {
    console.error("Cannot recreate IMAGE_KIND - it already exists");
    return;
  }

  // Validation

  // ensure unknown category is given if specified in kind
  if (kind.unknownCategoryId && !unknownCategory) {
    console.error("Unknown category specified in kind but not provided");
    return;
  }
  if (unknownCategory) {
    // ensure correct identifiers between kind and unknown category
    if (
      kind.unknownCategoryId !== unknownCategory.id ||
      unknownCategory.kind !== kind.id
    ) {
      console.error("Mismatch between kind and unknown category");
      return;
    }
  }

  // if no unknown category provided, create one
  if (!unknownCategory) {
    unknownCategory = generateCategory(
      UNKNOWN_CATEGORY_NAME,
      kind.id,
      UNKNOWN_ANNOTATION_CATEGORY_COLOR,
    );
    unknownCategory.id = kind.unknownCategoryId;
  }
  kindsAdapter.addOne(state.kinds, kind);

  // Initialize relationship entries
  state.relationships.kindToCategories[kind.id] = [unknownCategory.id];
  state.relationships.kindToAnnotations[kind.id] = [];

  // Add unknown category
  categoriesAdapter.addOne(state.categories, unknownCategory);

  // Initialize relationship entries
  if (kind.id === IMAGE_KIND)
    state.relationships.categoryToImages[unknownCategory.id] = [];
  else state.relationships.categoryToAnnotations[unknownCategory.id] = [];
};

export const deleteKindCascade = (
  state: WritableDraft<DataState>,
  kindId: string,
) => {
  if (kindId === "Images") return;
  if (!state.kinds.entities[kindId]) {
    console.error(`No kind with id "${kindId}"`);
    return;
  }
  const annotationIds = state.relationships.kindToAnnotations[kindId];
  const categoryIds = state.relationships.kindToCategories[kindId];
  delete state.relationships.kindToAnnotations[kindId];
  delete state.relationships.kindToCategories[kindId];

  // Delete related Aanotations
  annotationIds.forEach((annId) => deleteAnnotationCascade(state, annId));
  // Delete related categories
  categoryIds.forEach((catId) => deleteCategoryCascade(state, catId));

  // Clean up category relationships
  categoryIds.forEach((catId) => {
    delete state.relationships.categoryToAnnotations[catId];
  });

  // Finally, delete the kind
  kindsAdapter.removeOne(state.kinds, kindId);
};
