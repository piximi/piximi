import { createSelector } from "@reduxjs/toolkit";
import { difference } from "lodash";

import {
  selectAllCategories,
  selectExtendedAnnotationsByKindId,
  selectExtendedImages,
} from "store/data/selectors";
import type { RootState } from "store/rootReducer";
import { CATEGORY_COLORS } from "store/data/constants";

import { representsUnknown } from "utils/stringUtils";
import type { Partition } from "utils/dl/enums";

import { isFiltered } from "./filtering";
import {
  selectActiveKindId,
  selectActiveView,
  selectActiveFilters,
  selectSelectedImageIds,
} from "./selectors";

// --- Images ---

export const selectSelectedImages = createSelector(
  selectSelectedImageIds,
  selectExtendedImages,
  (selectedIds, images) => {
    const selectedSet = new Set(selectedIds);
    return images.filter((images) => selectedSet.has(images.id));
  },
);

// --- Categories ---

export const selectActiveCategories = createSelector(
  selectActiveView,
  selectActiveKindId,
  selectAllCategories,
  (view, kindId, categories) =>
    categories
      .filter((c) =>
        view === "images"
          ? c.type === "image"
          : c.type === "annotation" && c.kindId === kindId,
      )
      .sort((c) => (representsUnknown(c.id) ? -1 : 1)),
);

export const selectActiveKnownCategories = createSelector(
  selectActiveCategories,
  (activeCategories) => {
    return activeCategories.filter((cat) => !representsUnknown(cat.id));
  },
);
export const selectActiveUnknownCategory = createSelector(
  selectActiveCategories,
  (activeCategories) => {
    return activeCategories.find((cat) => representsUnknown(cat.id));
  },
);
export const selectAvaliableCategoryColors = createSelector(
  selectActiveCategories,
  (activeCategories): string[] => {
    const activeColors = activeCategories.map((cat) => cat.color.toUpperCase());
    const allCategoryColors = Object.values(CATEGORY_COLORS).map((color) =>
      color.toUpperCase(),
    );
    const availableColors = difference(allCategoryColors, activeColors);
    return availableColors;
  },
);

// --- Items pipeline ---

const selectActiveExtendedAnnotations = (state: RootState) =>
  selectExtendedAnnotationsByKindId(state, selectActiveKindId(state));

export const selectActiveItems = createSelector(
  selectActiveView,
  selectActiveExtendedAnnotations,
  selectExtendedImages,
  (view, annotations, images) => {
    if (view === "images") return images;
    return annotations;
  },
);

export const selectVisibleItems = createSelector(
  selectActiveFilters,
  selectActiveItems,
  (filters, entities) => {
    return entities.filter((entity) => !isFiltered(entity, filters ?? {}));
  },
);

export const selectActiveLabeledItems = createSelector(
  selectActiveItems,
  (activeItems) => {
    return activeItems.filter((item) => !representsUnknown(item.categoryId));
  },
);

export const selectActiveItemsByPartition = createSelector(
  selectActiveItems,
  (_: RootState, partition: Partition) => partition,
  (activeItems, partition) => {
    return activeItems.filter((item) => item.partition === partition);
  },
);

// --- Stats ---

export const selectTotalActiveUnlabeledItems = createSelector(
  selectActiveItems,
  (activeItems) => {
    return activeItems.reduce((total: number, item) => {
      if (representsUnknown(item.categoryId)) total++;
      return total;
    }, 0);
  },
);
