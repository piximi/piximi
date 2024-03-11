import { createSelector } from "@reduxjs/toolkit";
import {
  selectCategoriesDictionary,
  selectKindDictionary,
  selectThingsDictionary,
} from "./selectors";
import {
  selectActiveKindId,
  selectSelectedThingIds,
} from "store/slices/project/selectors";
import { NEW_UNKNOWN_CATEGORY_ID, NewCategory } from "types/Category";
import { difference, intersection } from "lodash";
import { CATEGORY_COLORS } from "utils/common/colorPalette";
import { NewAnnotationType } from "types/AnnotationType";
import { NewImageType } from "types/ImageType";
import { Partition } from "types";
import { ThingType } from "types/ThingType";

export const selectActiveKindObject = createSelector(
  selectActiveKindId,
  selectKindDictionary,
  (activeKind, kindDict) => {
    return kindDict[activeKind];
  }
);
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

export const selectActiveThingIds = createSelector(
  selectActiveKindObject,
  (kind) => {
    return kind.containing;
  }
);
export const selectActiveThings = createSelector(
  [selectActiveThingIds, selectThingsDictionary],
  (activeThingIds, thingDict) => {
    return activeThingIds.map((thingId) => thingDict[thingId]);
  }
);

export const selectActiveCategories = createSelector(
  [selectKindDictionary, selectCategoriesDictionary, selectActiveKindId],
  (kindDict, categoriesDict, kind) => {
    const categoriesOfKind = kindDict[kind].categories;

    return categoriesOfKind.map((catId) => categoriesDict[catId]);
  }
);
export const selectActiveKnownCategories = createSelector(
  selectActiveCategories,
  (activeCategories) => {
    return activeCategories.filter((cat) => cat.id !== NEW_UNKNOWN_CATEGORY_ID);
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

export const selectActiveLabeledThingsIds = createSelector(
  selectKindDictionary,
  selectCategoriesDictionary,
  selectActiveKindId,
  (kindDict, catDict, activeKind) => {
    if (!kindDict[activeKind]) return [];
    const thingsInKind = kindDict[activeKind].containing;
    const unknownThings = catDict[NEW_UNKNOWN_CATEGORY_ID].containing;
    return difference(thingsInKind, unknownThings);
  }
);
export const selectActiveUnlabeledThingsIds = createSelector(
  selectKindDictionary,
  selectCategoriesDictionary,
  selectActiveKindId,
  (kindDict, catDict, activeKind) => {
    if (!kindDict[activeKind]) return [];
    const thingsInKind = kindDict[activeKind].containing;
    const unknownThings = catDict[NEW_UNKNOWN_CATEGORY_ID].containing;
    return intersection(thingsInKind, unknownThings);
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
export const selectActiveUnlabeledThings = createSelector(
  selectActiveUnlabeledThingsIds,
  selectThingsDictionary,
  (activeUnlabeledThingIds, thingDict) => {
    const activeLabeledThings: Array<NewAnnotationType | NewImageType> = [];
    for (const thingId of activeUnlabeledThingIds) {
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

export const selectActiveThingsByPartition = createSelector(
  selectActiveThings,
  (activeThings) => {
    const thingsByPartition = activeThings.reduce(
      (
        byPartition: Record<string, Array<NewImageType | NewImageType>>,
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

const updateRecord = <T extends string | number | symbol, K>(
  record: Record<T, K[]>,
  key: T,
  value: K
) => {
  if (key in record) {
    record[key].push(value);
  } else {
    record[key] = [value];
  }
};

export const selectAnnotatedImages = createSelector(
  selectThingsByKind,
  (thingsByKind) => {
    const images = thingsByKind("Image");
    return images.filter((image) => {
      if ("containing" in image) {
        return image.containing.length > 0;
      }
      return false;
    }) as NewImageType[];
  }
);

export const selectActiveSelectedThings = createSelector(
  selectSelectedThingIds,
  selectActiveKindObject,
  selectThingsDictionary,
  (selectedThingIds, activeKind, thingDict) => {
    if (!activeKind) return [];
    const activeSelectedThingIds = intersection(
      selectedThingIds,
      activeKind.containing
    );
    const activeSelectedThings = activeSelectedThingIds.reduce(
      (things: ThingType[], thingId) => {
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
