import { createSelector } from "@reduxjs/toolkit";
import {
  selectCategoriesDictionary,
  selectKindDictionary,
  selectThingsDictionary,
} from "./selectors";
import { selectActiveKind } from "store/slices/project/selectors";
import { NEW_UNKNOWN_CATEGORY_ID, NewCategory } from "types/Category";
import { difference, intersection } from "lodash";
import { CATEGORY_COLORS } from "utils/common/colorPalette";
import { NewAnnotationType } from "types/AnnotationType";
import { NewImageType } from "types/ImageType";

export const selectThingsByKind = createSelector(
  [selectKindDictionary, selectThingsDictionary],
  (kindDict, thingDict) => {
    return (kind: string) => {
      const thingsOfKind = kindDict[kind].containing;
      return thingsOfKind.map((thingId) => thingDict[thingId]);
    };
  }
);

export const selectCategoriesByKind = createSelector(
  [selectKindDictionary, selectCategoriesDictionary],
  (kindDict, categoriesDict) => {
    return (kind: string) => {
      const categoriesOfKind = kindDict[kind].categories;
      return categoriesOfKind.map((catId) => categoriesDict[catId]);
    };
  }
);

export const selectCategoryProperty = createSelector(
  selectCategoriesDictionary,
  (entities) =>
    <S extends keyof NewCategory>(id: string, property: S) => {
      const category = entities[id];
      if (!category) return;
      return category[property];
    }
);
export const selectNumThingsByCatAndKind = createSelector(
  selectKindDictionary,
  selectCategoriesDictionary,
  (kindDict, catDict) => (catId: string, kind: string) => {
    const thingsOfKind = kindDict[kind].containing;
    const thingsOfCat = catDict[catId].containing;

    return intersection(thingsOfCat, thingsOfKind).length;
  }
);

export const selectActiveThings = createSelector(
  [selectKindDictionary, selectThingsDictionary, selectActiveKind],
  (kindDict, thingDict, kind) => {
    const thingsOfKind = kindDict[kind].containing;
    return thingsOfKind.map((thingId) => thingDict[thingId]);
  }
);
export const selectActiveCategories = createSelector(
  [selectKindDictionary, selectCategoriesDictionary, selectActiveKind],
  (kindDict, categoriesDict, kind) => {
    const categoriesOfKind = kindDict[kind].categories;

    return categoriesOfKind.map((catId) => categoriesDict[catId]);
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

export const selectActiveLabeledThingsIds = createSelector(
  selectKindDictionary,
  selectCategoriesDictionary,
  selectActiveKind,
  (kindDict, catDict, activeKind) => {
    if (!kindDict[activeKind]) return [];
    const thingsInKind = kindDict[activeKind].containing;
    const unknownThings = catDict[NEW_UNKNOWN_CATEGORY_ID].containing;
    return difference(thingsInKind, unknownThings);
  }
);

export const selectActiveLabeledThings = createSelector(
  selectActiveLabeledThingsIds,
  selectThingsDictionary,
  (activeLabeledThingIds, thingDict) => {
    const activeLabeledThings: Array<NewAnnotationType | NewImageType> = [];
    for (const thingId of activeLabeledThingIds) {
      const thing = thingDict[thingId];
      thing && activeLabeledThings.push(thing);
    }

    return activeLabeledThings;
  }
);

export const selectActiveLabeledThingsCount = createSelector(
  selectActiveLabeledThingsIds,
  (activeLabeledThings) => {
    return activeLabeledThings.length;
  }
);
