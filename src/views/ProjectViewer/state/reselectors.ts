import { createSelector } from "@reduxjs/toolkit";
import { difference } from "lodash";

import { CATEGORY_COLORS, representsUnknown } from "core/entities";

import {
  selectAllAnnotations,
  selectAllCategories,
  selectAllImages,
  selectAnnotationVolumeEntities,
  selectExtendedAnnotationsByKindId,
  selectExtendedImages,
} from "store/data/selectors";

import {
  selectActiveKindId,
  selectActiveView,
  selectSelectedImageIds,
} from "./selectors";

import type { Partition } from "core/entities";

import type { RootState } from "store/rootReducer";

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

/** Every item of the active view, before any filtering, with everything a
 * model needs; for fitting and predicting. */
export const selectActiveItems = createSelector(
  selectActiveView,
  selectActiveExtendedAnnotations,
  selectExtendedImages,
  (view, annotations, images) => {
    if (view === "images") return images;
    return annotations;
  },
);

/*
 * What the status checks and counts need from an item: no categories,
 * channels or image names joined in, so a change to the data costs one pass
 * over a table rather than a rebuild of every extended object.
 */
export type ActiveItemSummary = {
  id: string;
  categoryId: string;
  partition: Partition;
};

const selectImageSummaries = createSelector(
  selectAllImages,
  (images): ActiveItemSummary[] =>
    images.map(({ id, categoryId, partition }) => ({
      id,
      categoryId,
      partition,
    })),
);

const selectAnnotationSummariesByKind = createSelector(
  [
    selectAllAnnotations,
    selectAnnotationVolumeEntities,
    (_: RootState, kindId: string) => kindId,
  ],
  (annotations, volumes, kindId): ActiveItemSummary[] => {
    const summaries: ActiveItemSummary[] = [];
    for (const annotation of annotations) {
      const volume = volumes[annotation.volumeId];
      if (!volume || volume.kindId !== kindId) continue;
      summaries.push({
        id: annotation.id,
        categoryId: volume.categoryId,
        partition: annotation.partition,
      });
    }
    return summaries;
  },
);

export const selectActiveItemSummaries = (
  state: RootState,
): ActiveItemSummary[] =>
  selectActiveView(state) === "images"
    ? selectImageSummaries(state)
    : selectAnnotationSummariesByKind(state, selectActiveKindId(state));

export const selectActiveLabeledItems = createSelector(
  selectActiveItemSummaries,
  (items) => items.filter((item) => !representsUnknown(item.categoryId)),
);

export const selectActiveItemsByPartition = createSelector(
  selectActiveItemSummaries,
  (_: RootState, partition: Partition) => partition,
  (items, partition) => items.filter((item) => item.partition === partition),
);

// --- Stats ---

export const selectTotalActiveUnlabeledItems = createSelector(
  selectActiveItemSummaries,
  (items) =>
    items.reduce((total: number, item) => {
      if (representsUnknown(item.categoryId)) total++;
      return total;
    }, 0),
);
