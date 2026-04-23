import { createSelector } from "@reduxjs/toolkit";
import {
  selectActiveKindId,
  selectActiveView,
  selectActiveSelectedIds,
  selectActiveFilters,
  selectSelectedImageIds,
  selectActiveClassifierModelTarget,
} from "./selectors";

import {
  selectAllCategories,
  selectExtendedAnnotationsByKindId,
  selectExtendedImages,
} from "store/dataV2/selectors";
import { representsUnknown } from "utils/stringUtils";
import { RootState } from "store/rootReducer";
import { isFiltered } from "utils/arrayUtils";
import { selectKindClassifiers } from "store/classifier/selectors";
import { KindClassifier } from "store/types";
import classifierHandler from "utils/models/classification/classifierHandler";
import { Partition } from "utils/models/enums";

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

export const selectVisibleSelectedItems = createSelector(
  selectActiveSelectedIds,
  selectVisibleItems,
  (selectedIds, entities) => {
    const selectedSet = new Set(selectedIds);
    return entities.filter((entity) => selectedSet.has(entity.id));
  },
);

export const selectActiveSelectedItems = createSelector(
  selectActiveSelectedIds,
  selectActiveItems,
  (selectedIds, items) => {
    const selectedSet = new Set(selectedIds);
    return items.filter((items) => selectedSet.has(items.id));
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

export const selectTotalActiveLabeledItems = createSelector(
  selectActiveLabeledItems,
  (labeledItems) => {
    return labeledItems.length;
  },
);

export const selectTotalActiveUnlabeledItems = createSelector(
  selectActiveItems,
  (activeItems) => {
    return activeItems.reduce((total: number, item) => {
      if (representsUnknown(item.categoryId)) total++;
      return total;
    }, 0);
  },
);

// -- Models --

const selectActiveClassifier = createSelector(
  selectKindClassifiers,
  selectActiveClassifierModelTarget,
  (classifiers, modelTarget): KindClassifier => {
    return classifiers[modelTarget.id];
  },
);

export const selectActiveClassifierModelNameOrArch = createSelector(
  selectActiveClassifier,
  (classifier): string | number => {
    return classifier.modelNameOrArch;
  },
);
export const selectActiveClassifierModel = createSelector(
  selectActiveClassifierModelNameOrArch,
  (selectedModelNameOrArch) => {
    return typeof selectedModelNameOrArch === "string"
      ? classifierHandler.getModel(selectedModelNameOrArch)
      : undefined;
  },
);
