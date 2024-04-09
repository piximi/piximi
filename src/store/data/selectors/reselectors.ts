import { createSelector } from "@reduxjs/toolkit";
import {
  selectAllCategories,
  selectAllKinds,
  selectAllThings,
  selectCategoriesDictionary,
  selectKindDictionary,
  selectThingsDictionary,
} from "./selectors";
import {
  selectActiveKindId,
  selectSelectedThingIds,
} from "store/project/selectors";
import { difference, intersection } from "lodash";
import { selectActiveImage } from "store/imageViewer/reselectors";
import {
  selectActiveAnnotationIds,
  selectSelectedAnnotationIds,
} from "store/imageViewer";
import { decodeAnnotationNew } from "utils/annotator/rle";
import { selectWorkingAnnotationNew } from "store/imageViewer/selectors/selectWorkingAnnotation";
import { getCompleteEntity } from "store/entities/utils";
import { isUnknownCategory } from "utils/common/helpers";
import { Partition } from "utils/models/enums";
import { CATEGORY_COLORS } from "utils/common/constants";
import {
  Kind,
  KindWithCategories,
  NewAnnotationType,
  NewCategory,
  NewDecodedAnnotationType,
  NewImageType,
  Shape,
  ThingType,
} from "../types";

export const selectSplitThingDict = createSelector(
  selectAllThings,
  (things) => {
    return things.reduce(
      (
        splitDict: {
          images: Record<string, NewImageType>;
          objects: Record<string, NewAnnotationType>;
        },
        thing
      ) => {
        if (thing.kind === "Image") {
          splitDict.images[thing.id] = thing as NewImageType;
        } else {
          splitDict.objects[thing.id] = thing as NewAnnotationType;
        }
        return splitDict;
      },
      { images: {}, objects: {} }
    );
  }
);
export const selectActiveKindObject = createSelector(
  selectActiveKindId,
  selectKindDictionary,
  (activeKind, kindDict) => {
    return kindDict[activeKind];
  }
);

export const selectActiveUnknownCategoryId = createSelector(
  selectActiveKindObject,
  (activeKind) => {
    return activeKind.unknownCategoryId;
  }
);
export const selectActiveUnknownCategory = createSelector(
  selectActiveUnknownCategoryId,
  selectCategoriesDictionary,
  (unknownCatId, catDict) => {
    return catDict[unknownCatId];
  }
);
export const selectUnknownCategoryByKind = createSelector(
  selectKindDictionary,
  selectCategoriesDictionary,
  (kindDict, catDict) => {
    return (kind: string) => {
      const unknownCatId = kindDict[kind].unknownCategoryId;
      return catDict[unknownCatId];
    };
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

export const selectAllObjectKinds = createSelector(selectAllKinds, (kinds) => {
  return kinds.filter((kind) => kind.id !== "Image");
});
export const selectObjectKindDict = createSelector(
  selectAllObjectKinds,
  (kinds) => {
    return kinds.reduce((kindDict: Record<string, Kind>, kind) => {
      kindDict[kind.id] = kind;
      return kindDict;
    }, {});
  }
);

export const selectAllImages = createSelector(selectAllThings, (things) => {
  return things.filter((thing) => thing.kind === "Image") as NewImageType[];
});

export const selectAllObjects = createSelector(selectAllThings, (things) => {
  return things.filter(
    (thing) => thing.kind !== "Image"
  ) as NewAnnotationType[];
});
export const selectAllImageCategories = createSelector(
  selectAllCategories,
  (categories) => {
    return categories.filter((category) => category.kind !== "Image");
  }
);
export const selectAllObjectCategories = createSelector(
  selectAllCategories,
  (categories) => {
    return categories.filter((category) => category.kind !== "Image");
  }
);
export const selectObjectCategoryDict = createSelector(
  selectAllObjectCategories,
  (categories) => {
    return categories.reduce((catDict: Record<string, NewCategory>, c) => {
      catDict[c.id] = c;
      return catDict;
    }, {});
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
    return activeCategories.filter((cat) => !isUnknownCategory(cat.id));
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
  selectActiveKindObject,
  selectCategoriesDictionary,
  (activeKind, catDict) => {
    if (!activeKind) return [];
    const thingsInKind = activeKind.containing;
    const unknownCategoryId = activeKind.unknownCategoryId;
    const unknownThings = catDict[unknownCategoryId].containing;
    return difference(thingsInKind, unknownThings);
  }
);
export const selectActiveUnlabeledThingsIds = createSelector(
  selectActiveKindObject,
  selectCategoriesDictionary,
  (activeKind, catDict) => {
    if (!activeKind) return [];
    const thingsInKind = activeKind.containing;
    const unknownCategoryId = activeKind.unknownCategoryId;
    const unknownThings = catDict[unknownCategoryId].containing;
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

export const selectActiveAnnotationObjectsNew = createSelector(
  selectActiveImage,
  selectActiveAnnotationIds,
  selectThingsDictionary,
  selectCategoriesDictionary,
  (activeImage, activeAnnotationIds, thingDict, catDict) => {
    if (!activeImage) return [];
    const imageShape = activeImage.shape;
    const activePlane = activeImage.activePlane;
    const annotationObjects: Array<{
      annotation: NewDecodedAnnotationType;
      fillColor: string;
      imageShape: Shape;
    }> = [];

    for (const annotationId of activeAnnotationIds) {
      const annotation = thingDict[annotationId] as NewAnnotationType;

      const decodedAnnotation = !annotation.decodedMask
        ? decodeAnnotationNew(annotation)
        : (annotation as NewDecodedAnnotationType);

      if (
        annotation.plane === activePlane ||
        annotation.activePlane === activePlane
      ) {
        const fillColor = catDict[annotation.categoryId].color;
        annotationObjects.push({
          annotation: decodedAnnotation,
          fillColor,
          imageShape: imageShape,
        });
      }
    }
    return annotationObjects;
  }
);

export const selectWorkingAnnotationObjectNew = createSelector(
  selectWorkingAnnotationNew,
  selectActiveImage,
  selectCategoriesDictionary,
  (workingAnnotationEntity, activeImage, catDict) => {
    if (!workingAnnotationEntity.saved || !activeImage) return;
    const workingAnnotation = getCompleteEntity(
      workingAnnotationEntity
    ) as NewAnnotationType;
    const annotation = !workingAnnotation.decodedMask
      ? decodeAnnotationNew(workingAnnotation)
      : (workingAnnotation as NewDecodedAnnotationType);
    const fillColor = catDict[workingAnnotation.categoryId].color;
    return {
      annotation: annotation,
      fillColor: fillColor,
      imageShape: activeImage.shape,
    };
  }
);

export const selectActiveAnnotationsNew = createSelector(
  [selectActiveAnnotationIds, selectThingsDictionary],
  (annotationIds, thingsDict): Array<NewDecodedAnnotationType> => {
    if (!annotationIds.length) return [];

    return annotationIds.map((annotationId) => {
      const annotation = thingsDict[annotationId] as NewAnnotationType;
      const decodedAnnotation = !annotation.decodedMask
        ? decodeAnnotationNew(annotation)
        : (annotation as NewDecodedAnnotationType);
      return decodedAnnotation;
    });
  }
);

export const selectSelectedActiveAnnotations = createSelector(
  [selectSelectedAnnotationIds, selectThingsDictionary],
  (annotationIds, thingsDict): Array<NewDecodedAnnotationType> => {
    if (!annotationIds.length) return [];

    return annotationIds.map((annotationId) => {
      const annotation = thingsDict[annotationId] as NewAnnotationType;
      const decodedAnnotation = !annotation.decodedMask
        ? decodeAnnotationNew(annotation)
        : (annotation as NewDecodedAnnotationType);
      return decodedAnnotation;
    });
  }
);

export const selectImageViewerActiveKinds = createSelector(
  selectActiveImage,
  selectAllKinds,
  (activeImage, allKinds) => {
    if (!activeImage) return [];
    const activeKinds: Kind[] = [];
    const activeAnnotationIds = activeImage.containing;

    allKinds.forEach((kind) => {
      const intersect = intersection(activeAnnotationIds, kind.containing);
      if (intersect.length > 0) {
        activeKinds.push(kind);
      }
    });

    return activeKinds;
  }
);

export const selectImageViewerActiveKindsWithFullCat = createSelector(
  selectAllKinds,
  selectCategoriesDictionary,
  (allKinds, catDict) => {
    const activeKinds: Array<KindWithCategories> = [];

    allKinds.forEach((kind) => {
      if (kind.id === "Image") return;
      activeKinds.push({
        ...kind,
        categories: kind.categories.map((id) => catDict[id]),
      });
    });

    return activeKinds;
  }
);

export const selectActiveImageCategoryObjectCount = createSelector(
  selectActiveImage,
  selectKindDictionary,
  (activeImage, kindDict) =>
    (category: NewCategory, kindIfUnknown?: string) => {
      if (!activeImage) return 0;

      const objectsInImage = activeImage.containing;
      let objectsInCategory;
      if (kindIfUnknown) {
        const kind = kindDict[kindIfUnknown];
        if (!kind) return 0;
        const objectsInKind = kind.containing;
        const unknownObjects = category.containing;
        objectsInCategory = intersection(objectsInKind, unknownObjects);
      } else {
        objectsInCategory = category.containing;
      }

      const objectsInBoth = intersection(objectsInCategory, objectsInImage);
      return objectsInBoth.length;
    }
);

export const selectFirstUnknownCategory = createSelector(
  selectAllKinds,
  selectCategoriesDictionary,
  (kinds, catDict) => {
    if (kinds.length < 2) return;
    const unknownCatId = kinds[1].unknownCategoryId;
    return catDict[unknownCatId];
  }
);

export const selectDataProject = createSelector(
  selectAllKinds,
  selectAllCategories,
  selectAllThings,
  (kinds, categories, things) => {
    return { kinds, categories, things };
  }
);
