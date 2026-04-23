import { createSelector } from "@reduxjs/toolkit";
import { difference, intersection } from "lodash";

import {
  selectCategoriesDictionary,
  selectKindDictionary,
  selectThingsDictionary,
} from "store/data/selectors";
import {
  selectActiveKindId,
  selectActiveView,
  selectSelectedThingIds,
} from "./selectors";

import { isUnknownCategory } from "store/data/utils";

import { Thing } from "store/data/types";
import { selectAllCategories } from "store/dataV2/selectors";
import { representsUnknown } from "utils/stringUtils";

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

/*
~~ OLD
*/

export const selectActiveKindObject = createSelector(
  selectActiveKindId,
  selectKindDictionary,
  (activeKind, kindDict) => {
    return kindDict[activeKind]!;
  },
);

export const selectActiveKnownCategories = createSelector(
  selectActiveCategories,
  (activeCategories) => {
    return activeCategories.filter((cat) => !isUnknownCategory(cat.id));
  },
);

export const selectActiveThingIds = createSelector(
  selectActiveKindObject,
  (kind) => {
    if (!kind) return [];
    return kind.containing;
  },
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
  },
);

export const selectActiveLabeledThingsCount = createSelector(
  selectActiveLabeledThingsIds,
  (activeLabeledThings) => {
    return activeLabeledThings.length;
  },
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
  },
);

export const selectActiveSelectedThingIds = createSelector(
  selectSelectedThingIds,
  selectActiveThingIds,
  (selectedIds, activeIds) => {
    return intersection(activeIds, selectedIds);
  },
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
      [],
    );

    return activeSelectedThings;
  },
);
