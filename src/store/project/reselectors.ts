import { createSelector } from "@reduxjs/toolkit";
import { difference, intersection } from "lodash";

import {
  selectAllKindIds,
  selectAnnotationsByKind,
  selectCategoriesDictionary,
  selectImageGridImages,
  selectKindDictionary,
  selectThingsDictionary,
} from "store/data/selectors";
import {
  selectActiveKindId,
  selectKindTabFilters,
  selectSelectedAnnotations,
  selectSelectedImages,
  selectSelectedThingIds,
  selectThingFilters,
} from "./selectors";

import { isUnknownCategory } from "store/data/utils";

import { Partition } from "utils/models/enums";

import {
  AnnotationObject,
  ImageGridObject,
  ImageObject,
  Thing,
  TSAnnotationObject,
} from "store/data/types";
import { CATEGORY_COLORS } from "store/data/constants";
import { isFiltered } from "utils/arrayUtils";

export const selectVisibleKinds = createSelector(
  selectKindTabFilters,
  selectAllKindIds,
  (filteredKinds, allKinds) => {
    return difference(allKinds, filteredKinds);
  },
);

export const selectActiveKindObject = createSelector(
  selectActiveKindId,
  selectKindDictionary,
  (activeKind, kindDict) => {
    return kindDict[activeKind]!;
  },
);

export const selectActiveUnknownCategoryId = createSelector(
  selectActiveKindObject,
  (activeKind) => {
    if (!activeKind) return;
    return activeKind.unknownCategoryId;
  },
);

export const selectActiveCategories = createSelector(
  [selectKindDictionary, selectCategoriesDictionary, selectActiveKindId],
  (kindDict, categoriesDict, kind) => {
    if (!kindDict[kind]) return [];
    const categoriesOfKind = kindDict[kind]!.categories;

    return categoriesOfKind.map((catId) => categoriesDict[catId]!);
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

const selectActiveThingIds = createSelector(selectActiveKindObject, (kind) => {
  if (!kind) return [];
  return kind.containing;
});

export const selectActiveThings = createSelector(
  [selectActiveThingIds, selectThingsDictionary],
  (activeThingIds, thingDict) => {
    return activeThingIds.map((thingId) => thingDict[thingId]!);
  },
);

const selectActiveLabeledThingsIds = createSelector(
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

export const selectActiveThingsByPartition = createSelector(
  selectActiveThings,
  (activeThings) => {
    const thingsByPartition = activeThings.reduce(
      (
        byPartition: Record<Partition, Array<AnnotationObject | ImageObject>>,
        thing,
      ) => {
        switch (thing.partition) {
          case Partition.Inference:
            byPartition[Partition.Inference].push(thing);
            break;
          case Partition.Training:
            byPartition[Partition.Training].push(thing);
            break;
          case Partition.Unassigned:
            byPartition[Partition.Unassigned].push(thing);
            break;
          case Partition.Validation:
            byPartition[Partition.Validation].push(thing);
            break;
        }
        return byPartition;
      },
      {
        [Partition.Inference]: [],
        [Partition.Training]: [],
        [Partition.Validation]: [],
        [Partition.Unassigned]: [],
      },
    );
    return thingsByPartition;
  },
);

export const selectFilteredGridImages = createSelector(
  selectImageGridImages,
  selectThingFilters,
  (allImages, filters) => {
    return allImages.filter((image) => !isFiltered(image, filters ?? {}));
  },
);

export const selectSelectedGridImages = createSelector(
  selectSelectedImages,
  selectFilteredGridImages,
  (selectedImages, filteredImages) => {
    return Object.entries(selectedImages).reduce(
      (visible: ImageGridObject[], [id, timepoints]) => {
        timepoints.forEach((tp) => {
          const imageIndex = filteredImages.findIndex(
            (image) => image.id === id && image.timepoint === tp,
          );
          if (imageIndex > -1) {
            visible.push(filteredImages[imageIndex]);
          }
        });
        console.log(visible);
        return visible;
      },
      [],
    );
  },
);

export const selectActiveAnnotations = createSelector(
  selectActiveKindId,
  selectAnnotationsByKind,
  (activeKind, annotationsByKind): TSAnnotationObject[] => {
    const activeAnnotations = annotationsByKind[activeKind];
    if (!activeAnnotations) return [];
    return activeAnnotations;
  },
);

export const selectFilteredAnnotationsByKind = createSelector(
  selectAnnotationsByKind,
  selectThingFilters,
  (annotationsByKind, filters) =>
    (kind: string): TSAnnotationObject[] => {
      const activeAnnotations = annotationsByKind[kind] ?? [];
      return activeAnnotations.filter(
        (image) => !isFiltered(image, filters ?? {}),
      );
    },
);

export const selectActiveFilteredGridAnnotations = createSelector(
  selectActiveAnnotations,
  selectThingFilters,
  (activeAnnotations, filters): TSAnnotationObject[] => {
    return activeAnnotations.filter(
      (image) => !isFiltered(image, filters ?? {}),
    );
  },
);

export const selectActiveSelectedGridAnnotations = createSelector(
  selectSelectedAnnotations,
  selectActiveFilteredGridAnnotations,
  (selectedAnnotations, filteredAnnotations) => {
    return filteredAnnotations.filter((ann) =>
      selectedAnnotations.includes(ann.id),
    );
  },
);
