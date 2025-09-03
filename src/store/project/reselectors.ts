import { createSelector } from "@reduxjs/toolkit";
import { difference } from "lodash";

import {
  selectAllKindIds,
  selectAnnotationEntities,
  selectKindToCategories,
  selectCategoryEntities,
  selectImageDataEntities,
  selectKindEntities,
  selectKindToAnnotations,
  selectMetadataEntities,
  selectCategoryToAllItems,
} from "store/data/selectors";
import {
  selectActiveKindId,
  selectActiveKindItemFilters,
  selectAllActiveSelectedKindItemIds,
  selectExpandedTime,
  selectKindTabFilters,
} from "./selectors";

import {
  getKindItemsFromAnnotations,
  getKindItemsFromImages,
  isUnknownCategory,
} from "store/data/utils";

import { Category, GeneralizedKindItem, Kind } from "store/data/types";
import { CATEGORY_COLORS, IMAGE_KIND } from "store/data/constants";
import { RequireField } from "utils/types";

// Kind Selectors
export const selectVisibleKinds = createSelector(
  selectKindTabFilters,
  selectAllKindIds,
  (filteredKinds, allKinds) => {
    return difference(allKinds, filteredKinds);
  },
);

export const selectActiveKindObject = createSelector(
  selectActiveKindId,
  selectKindEntities,
  (activeKind, kindDict): Kind => {
    return kindDict[activeKind];
  },
);

// Category Selectors
export const selectActiveUnknownCategoryId = createSelector(
  selectActiveKindObject,
  (activeKind) => {
    return activeKind.unknownCategoryId;
  },
);

export const selectActiveCategories = createSelector(
  [selectActiveKindId, selectKindToCategories, selectCategoryEntities],
  (kindId, categoriesByKind, catDict): Category[] => {
    return categoriesByKind[kindId].map((id) => catDict[id]);
  },
);

export const selectActiveKnownCategories = createSelector(
  selectActiveCategories,
  (activeCategories) => {
    return activeCategories.filter((cat) => !isUnknownCategory(cat.id));
  },
);

export const selectActiveCategoryNames = createSelector(
  selectActiveCategories,
  (activeCategories) => {
    return activeCategories.map((cat) => cat.name);
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

export const selectActiveKindItemRecord = createSelector(
  [
    selectActiveKindId,
    selectExpandedTime,
    selectMetadataEntities,
    selectImageDataEntities,
    selectKindToAnnotations,
    selectAnnotationEntities,
  ],
  (
    activeKindId,
    expandedTime,
    metaDict,
    imageDict,
    kindToAnnotations,
    annotationDict,
  ): Record<string, GeneralizedKindItem> => {
    if (activeKindId === IMAGE_KIND) {
      return getKindItemsFromImages(imageDict, metaDict, expandedTime);
    }
    const activeAnnotationIds = kindToAnnotations[activeKindId] ?? [];
    const activeAnnotations = activeAnnotationIds.map(
      (id) => annotationDict[id],
    );
    return getKindItemsFromAnnotations(activeAnnotations);
  },
);
export const selectActiveKindItemArray = createSelector(
  [selectActiveKindItemRecord],
  (kindItemRecord): GeneralizedKindItem[] => {
    return Object.values(kindItemRecord);
  },
);

export const selectItemsContainTimeSeries = createSelector(
  selectActiveKindId,
  selectActiveKindItemArray,
  selectMetadataEntities,
  (activeKindId, items, metadataEntities) => {
    let hasTimeSeries = false;
    if (activeKindId !== IMAGE_KIND) return hasTimeSeries;
    for (const item of items) {
      if (item.metadataId) {
        if (metadataEntities[item.metadataId].timeSeries) {
          hasTimeSeries = true;
          break;
        }
      }
    }
    return hasTimeSeries;
  },
);

export const selectActiveUnknownKindItems = createSelector(
  selectActiveKindObject,
  selectActiveKindItemRecord,
  selectCategoryToAllItems,
  (kindObject, activeKindItemRecord, cat2Items) => {
    const unknownCategoryId = kindObject.unknownCategoryId;
    const unknownCatItems = cat2Items[unknownCategoryId];
    return unknownCatItems.map((itemId) => activeKindItemRecord[itemId]);
  },
);

export const selectActiveFilteredKindItems = createSelector(
  selectActiveKindItemFilters,
  selectActiveKindItemArray,
  (itemFilters, items) => {
    return items.filter(
      (item) =>
        !(
          itemFilters.categoryId.includes(item.categoryId) ||
          itemFilters.partition.includes(item.partition)
        ),
    );
  },
);
export const selectActiveFilteredSelectedKindItems = createSelector(
  selectActiveKindItemFilters,
  selectAllActiveSelectedKindItemIds,
  selectActiveKindItemArray,
  (itemFilters, selectedItemsIds, items) => {
    return items.filter(
      (item) =>
        !(
          itemFilters.categoryId.includes(item.categoryId) ||
          itemFilters.partition.includes(item.partition)
        ) && selectedItemsIds.includes(item.id),
    );
  },
);

export const selectActiveFilteredSelectedImages = createSelector(
  selectActiveFilteredSelectedKindItems,
  selectActiveFilteredKindItems,
  (selectedItems, items) => {
    if (selectedItems.length === 0) {
      if (items.length === 0) {
        return [];
      }
      return items[0]?.kind === IMAGE_KIND ? items : [];
    }
    return selectedItems[0]?.kind === IMAGE_KIND ? selectedItems : [];
  },
);

export const selectActiveFilteresSelectedKindItemIds = createSelector(
  selectActiveFilteredSelectedKindItems,
  (items) => items.map((item) => item.id),
);
