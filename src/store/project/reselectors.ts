import { createSelector } from "@reduxjs/toolkit";
import { difference, intersection } from "lodash";

import {
  selectAllKindIds,
  selectCategoriesDictionary,
  selectKindDictionary,
  selectThingsDictionary,
} from "store/data/selectors";
import {
  selectActiveKindId,
  selectActiveThingFilters,
  selectKindTabFilters,
  selectSelectedThingIds,
} from "./selectors";

import { isUnknownCategory, updateRecord } from "utils/common/helpers";

import { CATEGORY_COLORS } from "utils/common/constants";
import { Partition } from "utils/models/enums";

import { AnnotationObject, ImageObject, Thing } from "store/data/types";

export const selectVisibleKinds = createSelector(
  selectKindTabFilters,
  selectAllKindIds,
  (filteredKinds, allKinds) => {
    return difference(allKinds, filteredKinds);
  }
);

export const selectActiveKindObject = createSelector(
  selectActiveKindId,
  selectKindDictionary,
  (activeKind, kindDict) => {
    return kindDict[activeKind]!;
  }
);

export const selectActiveUnknownCategoryId = createSelector(
  selectActiveKindObject,
  (activeKind) => {
    if (!activeKind) return;
    return activeKind.unknownCategoryId;
  }
);

export const selectActiveCategories = createSelector(
  [selectKindDictionary, selectCategoriesDictionary, selectActiveKindId],
  (kindDict, categoriesDict, kind) => {
    if (!kindDict[kind]) return [];
    const categoriesOfKind = kindDict[kind]!.categories;

    return categoriesOfKind.map((catId) => categoriesDict[catId]!);
  }
);

export const selectActiveKnownCategories = createSelector(
  selectActiveCategories,
  (activeCategories) => {
    return activeCategories.filter((cat) => !isUnknownCategory(cat.id));
  }
);

export const selectActiveUnknownCategory = createSelector(
  selectActiveUnknownCategoryId,
  selectCategoriesDictionary,
  (unknownCatId, catDict) => {
    if (!unknownCatId) return;
    return catDict[unknownCatId]!;
  }
);

export const selectActiveCategoryCount = createSelector(
  selectActiveCategories,
  (activeCategories) => {
    return activeCategories.length;
  }
);

export const selectActiveKnownCategoryCount = createSelector(
  selectActiveKnownCategories,
  (activeKnownCategories) => {
    return activeKnownCategories.length;
  }
);

export const selectActiveCategoryNames = createSelector(
  selectActiveCategories,
  (activeCategories) => {
    return activeCategories.map((cat) => cat.name);
  }
);

export const selectActiveCategoryColors = createSelector(
  selectActiveCategories,
  (activeCategories) => {
    const activeColors = activeCategories.map((cat) => cat.color.toUpperCase());
    const allCategoryColors = Object.values(CATEGORY_COLORS).map((color) =>
      color.toUpperCase()
    );
    const availableColors = difference(allCategoryColors, activeColors);
    return availableColors;
  }
);

export const selectUnfilteredActiveCategoryIds = createSelector(
  selectActiveThingFilters,
  selectActiveCategories,
  (thingFilters, activeCategories) => {
    const filteredCategories = thingFilters.categoryId;
    const unfilteredCategories = difference(
      activeCategories.map((cat) => cat.id),
      filteredCategories
    );
    return unfilteredCategories;
  }
);

export const selectActiveThingIds = createSelector(
  selectActiveKindObject,
  (kind) => {
    if (!kind) return [];
    return kind.containing;
  }
);

export const selectActiveThings = createSelector(
  [selectActiveThingIds, selectThingsDictionary],
  (activeThingIds, thingDict) => {
    return activeThingIds.map((thingId) => thingDict[thingId]!);
  }
);

export const selectActiveLabeledThingsIds = createSelector(
  selectActiveKindObject,
  selectCategoriesDictionary,
  (activeKind, catDict) => {
    if (!activeKind) return [];
    const thingsInKind = activeKind.containing;
    const unknownCategoryId = activeKind.unknownCategoryId;
    const unknownThings = catDict[unknownCategoryId]!.containing;
    return difference(thingsInKind, unknownThings);
  }
);

export const selectActiveLabeledThingsCount = createSelector(
  selectActiveLabeledThingsIds,
  (activeLabeledThings) => {
    return activeLabeledThings.length;
  }
);

export const selectActiveLabeledThings = createSelector(
  selectActiveLabeledThingsIds,
  selectThingsDictionary,
  (activeLabeledThingIds, thingDict) => {
    const activeLabeledThings: Array<AnnotationObject | ImageObject> = [];
    for (const thingId of activeLabeledThingIds) {
      const thing = thingDict[thingId];
      thing && activeLabeledThings.push(thing);
    }

    return activeLabeledThings;
  }
);

export const selectActiveUnlabeledThingsIds = createSelector(
  selectActiveKindObject,
  selectCategoriesDictionary,
  (activeKind, catDict) => {
    if (!activeKind) return [];
    const thingsInKind = activeKind.containing;
    const unknownCategoryId = activeKind.unknownCategoryId;
    const unknownThings = catDict[unknownCategoryId]!.containing;
    return intersection(thingsInKind, unknownThings);
  }
);

export const selectActiveUnlabeledThings = createSelector(
  selectActiveUnlabeledThingsIds,
  selectThingsDictionary,
  (activeUnlabeledThingIds, thingDict) => {
    const activeLabeledThings: Array<AnnotationObject | ImageObject> = [];
    for (const thingId of activeUnlabeledThingIds) {
      const thing = thingDict[thingId];
      thing && activeLabeledThings.push(thing);
    }

    return activeLabeledThings;
  }
);

export const selectActiveSelectedThingIds = createSelector(
  selectSelectedThingIds,
  selectActiveThingIds,
  (selectedIds, activeIds) => {
    return intersection(activeIds, selectedIds);
  }
);

export const selectActiveSelectedThings = createSelector(
  selectActiveSelectedThingIds,
  selectThingsDictionary,
  (activeSelectedThingIds, thingDict) => {
    const activeSelectedThings = activeSelectedThingIds.reduce(
      (things: Thing[], thingId) => {
        const thing = thingDict[thingId];
        if (thing) {
          things.push(thing);
        }
        return things;
      },
      []
    );

    return activeSelectedThings;
  }
);

export const selectActiveThingsByPartition = createSelector(
  selectActiveThings,
  (activeThings) => {
    const thingsByPartition = activeThings.reduce(
      (
        byPartition: Record<string, Array<ImageObject | ImageObject>>,
        thing
      ) => {
        switch (thing.partition) {
          case Partition.Inference:
            updateRecord(byPartition, Partition.Inference, thing);
            break;
          case Partition.Training:
            updateRecord(byPartition, Partition.Training, thing);
            break;
          case Partition.Unassigned:
            updateRecord(byPartition, Partition.Unassigned, thing);
            break;
          case Partition.Validation:
            updateRecord(byPartition, Partition.Validation, thing);
            break;
        }
        return byPartition;
      },
      {}
    );
    return thingsByPartition;
  }
);
