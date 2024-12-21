import { createSelector } from "@reduxjs/toolkit";
import { difference } from "lodash";

import {
  selectCategoryChanges,
  selectKindChanges,
  selectSelectedAnnotationIds,
  selectThingChanges,
  selectWorkingAnnotationEntity,
} from "./selectors";
import {
  selectAllCategories,
  selectAllKinds,
  selectThingsDictionary,
} from "store/data/selectors";
import {
  selectActiveImageId,
  selectImageStackImageIds,
} from "../imageViewer/selectors";

import { decodeAnnotation } from "views/ImageViewer/utils/rle";
import { generateBlankColors } from "utils/common/tensorHelpers";
import { getCompleteEntity } from "utils/common/helpers";

import {
  AnnotationObject,
  Category,
  DecodedAnnotationObject,
  ImageObject,
  Kind,
  Shape,
} from "store/data/types";
import { Colors, ColorsRaw } from "utils/common/types";

export const selectImages = createSelector(
  selectImageStackImageIds,
  selectThingsDictionary,
  selectThingChanges,
  (imageIds, things, changes) => {
    const images: Record<string, ImageObject> = {};
    const newObjectsByImage = Object.values(changes.added).reduce(
      (byImage: Record<string, string[]>, change) => {
        byImage[change.imageId] = [
          ...(byImage[change.imageId] ?? []),
          change.id,
        ];
        return byImage;
      },
      {}
    );
    for (const imageId of imageIds) {
      const image = things[imageId] as ImageObject;
      let finalImage = { ...image };
      if (changes.deleted.includes(imageId)) {
        continue;
      } else if (changes.edited[imageId]) {
        const { id, ...imageChanges } = changes.edited[imageId];

        finalImage = { ...finalImage, ...imageChanges };
      }
      finalImage.containing = difference(
        finalImage.containing,
        changes.deleted
      );
      finalImage.containing.push(...(newObjectsByImage[imageId] ?? []));
      images[imageId] = finalImage;
    }
    return images;
  }
);

export const selectImagesArray = createSelector(selectImages, (images) =>
  Object.values(images)
);

export const selectActiveImage = createSelector(
  selectActiveImageId,
  selectImages,
  (activeImageId, images) => (activeImageId ? images[activeImageId] : undefined)
);
export const selectActiveImageRawColor = createSelector(
  selectActiveImage,
  (image): ColorsRaw => {
    let colors: Colors;
    if (!image) {
      colors = generateBlankColors(3);
    } else {
      colors = image.colors;
    }

    return {
      // is sync appropriate? if so we may need to dispose??
      color: colors.color.arraySync() as [number, number, number][],
      range: colors.range,
      visible: colors.visible,
    };
  }
);

export const selectActiveImageObjectIds = createSelector(
  selectActiveImage,
  (activeImage) => activeImage?.containing ?? []
);

export const selectKinds = createSelector(
  selectAllKinds,
  selectKindChanges,
  selectCategoryChanges,
  selectThingChanges,
  (rootKinds, kindChanges, categoryChanges, thingChanges) => {
    const finalKinds = { ...kindChanges.added };
    const newObjectsByKind = Object.values(thingChanges.added).reduce(
      (byImage: Record<string, string[]>, change) => {
        byImage[change.imageId] = [
          ...(byImage[change.imageId] ?? []),
          change.id,
        ];
        return byImage;
      },
      {}
    );
    const newCategoriesByKind = Object.values(categoryChanges.added).reduce(
      (byKind: Record<string, string[]>, change) => {
        byKind[change.kind] = [...(byKind[change.kind] ?? []), change.id];
        return byKind;
      },
      {}
    );
    for (const kind of rootKinds) {
      let finalKind: Kind = { ...kind };
      const kindId = kind.id;
      if (kindChanges.deleted.includes(kindId)) {
        continue;
      } else if (kindChanges.edited[kindId]) {
        const { id, ...changes } = kindChanges.edited[kindId];

        finalKind = { ...finalKind, ...changes };
      }
      finalKind.containing = difference(
        finalKind.containing,
        thingChanges.deleted
      );
      finalKind.containing.push(...(newObjectsByKind[kindId] ?? []));
      finalKind.categories = difference(
        finalKind.categories,
        categoryChanges.deleted
      );
      finalKind.categories.push(...(newCategoriesByKind[kindId] ?? []));
      finalKinds[kindId] = finalKind;
    }
    return finalKinds;
  }
);
export const selectKindsArray = createSelector(selectKinds, (kinds) =>
  Object.values(kinds)
);

export const selectCategories = createSelector(
  selectAllCategories,
  selectCategoryChanges,
  selectThingChanges,
  (rootCategories, categoryChanges, thingChanges) => {
    const finalCategories = { ...categoryChanges.added };
    const newObjectsByCategory = Object.values(thingChanges.added).reduce(
      (byCategory: Record<string, string[]>, change) => {
        byCategory[change.categoryId] = [
          ...(byCategory[change.categoryId] ?? []),
          change.id,
        ];
        return byCategory;
      },
      {}
    );
    const editedObjectsByCategory = Object.values(thingChanges.edited).reduce(
      (byCategory: Record<string, string[]>, change) => {
        if (change.categoryId) {
          byCategory[change.categoryId] = [
            ...(byCategory[change.categoryId] ?? []),
            change.id,
          ];
        }
        return byCategory;
      },
      {}
    );
    for (const category of rootCategories) {
      let finalCategory: Category = { ...category };
      const categoryId = category.id;
      finalCategory.containing = difference(
        finalCategory.containing,
        thingChanges.deleted
      );

      finalCategory.containing.push(
        ...(newObjectsByCategory[categoryId] ?? []),
        ...(editedObjectsByCategory[categoryId] ?? [])
      );
      if (categoryChanges.edited[categoryId]) {
        finalCategory = {
          ...finalCategory,
          ...categoryChanges.edited[categoryId],
        };
      }
      finalCategories[categoryId] = finalCategory;
    }
    return finalCategories;
  }
);

export const selectCategoriesArray = createSelector(
  selectCategories,
  (categories) => Object.values(categories)
);

export const selectCategoriesByKind = createSelector(
  selectKindsArray,
  selectCategories,
  (allKinds, catDict) => {
    const catsByKind: Record<
      string,
      { kindId: string; categories: Category[] }
    > = {};
    allKinds.forEach((kind) => {
      if (kind.id === "Image") return;
      catsByKind[kind.id] = {
        kindId: kind.id,
        categories: kind.categories.map((id) => catDict[id]),
      };
    });

    return catsByKind;
  }
);

export const selectCategoriesByKindArray = createSelector(
  selectCategoriesByKind,
  (catsByKind) => Object.values(catsByKind)
);

export const selectUpdatedThings = createSelector(
  selectThingsDictionary,
  selectThingChanges,
  (thingsDict, thingChanges) => {
    const finalThings: Record<string, ImageObject | DecodedAnnotationObject> = {
      ...thingChanges.added,
    };
    const remainingThings = difference(
      Object.keys(thingsDict),
      thingChanges.deleted
    );
    for (const thingId of remainingThings) {
      const thing = thingsDict[thingId];
      if (thingChanges.edited[thingId]) {
        finalThings[thingId] = {
          ...(thing as ImageObject | DecodedAnnotationObject),
          ...thingChanges.edited[thingId],
        };
      }
    }

    return finalThings;
  }
);
export const selectUpdatedObjects = createSelector(
  selectThingsDictionary,
  selectThingChanges,
  (thingsDict, thingChanges) => {
    const finalThings: Record<string, DecodedAnnotationObject> = {
      ...thingChanges.added,
    };
    const remainingThings = difference(
      Object.keys(thingsDict),
      thingChanges.deleted
    );

    for (const thingId of remainingThings) {
      const thing = thingsDict[thingId];
      if (thing!.kind === "Image") continue;

      if (thingChanges.edited[thingId]) {
        finalThings[thingId] = {
          ...(thing as DecodedAnnotationObject),
          ...thingChanges.edited[thingId],
        };
      } else {
        finalThings[thingId] = thing as DecodedAnnotationObject;
      }
    }

    return finalThings;
  }
);
export const selectUpdatedImages = createSelector(
  selectThingsDictionary,
  selectThingChanges,
  (thingsDict, thingChanges) => {
    const finalThings: Record<string, ImageObject> = {};
    const remainingThings = difference(
      Object.keys(thingsDict),
      thingChanges.deleted
    );
    for (const thingId of remainingThings) {
      const thing = thingsDict[thingId];
      if (thing!.kind !== "Image") continue;
      if (thingChanges.edited[thingId]) {
        finalThings[thingId] = {
          ...(thing as ImageObject),
          ...thingChanges.edited[thingId],
        };
      }
    }

    return finalThings;
  }
);

export const selectFullWorkingAnnotation = createSelector(
  selectWorkingAnnotationEntity,

  (workingAnnotationEntity) => {
    if (!workingAnnotationEntity.saved) return;
    return {
      ...workingAnnotationEntity.saved,
      ...workingAnnotationEntity.changes,
    } as DecodedAnnotationObject;
  }
);

export const selectActiveAnnotations = createSelector(
  [selectActiveImage, selectUpdatedObjects],
  (activeImage, objects): Array<DecodedAnnotationObject> => {
    if (!activeImage) return [];
    return activeImage.containing.map((annotationId) => {
      const annotation = objects[annotationId] as AnnotationObject;

      const decodedAnnotation = !annotation.decodedMask
        ? decodeAnnotation(annotation)
        : (annotation as DecodedAnnotationObject);
      return decodedAnnotation;
    });
  }
);

export const selectActiveAnnotationsViews = createSelector(
  selectActiveImage,
  selectUpdatedObjects,
  selectCategories,
  (activeImage, objects, catDict) => {
    if (!activeImage) return [];
    const imageShape = activeImage.shape;
    const activePlane = activeImage.activePlane;
    const annotationObjects: Array<{
      annotation: DecodedAnnotationObject;
      fillColor: string;
      imageShape: Shape;
    }> = [];

    for (const annotationId of activeImage.containing) {
      const annotation = objects[annotationId] as AnnotationObject;

      const decodedAnnotation = !annotation.decodedMask
        ? decodeAnnotation(annotation)
        : (annotation as DecodedAnnotationObject);

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
export const selectWorkingAnnotationView = createSelector(
  selectWorkingAnnotationEntity,
  selectActiveImage,
  selectCategories,
  (workingAnnotationEntity, activeImage, catDict) => {
    if (!workingAnnotationEntity.saved || !activeImage) return;
    const workingAnnotation = getCompleteEntity(
      workingAnnotationEntity
    ) as AnnotationObject;
    const annotation = !workingAnnotation.decodedMask
      ? decodeAnnotation(workingAnnotation)
      : (workingAnnotation as DecodedAnnotationObject);
    const fillColor = catDict[workingAnnotation.categoryId].color;
    return {
      annotation: annotation,
      fillColor: fillColor,
      imageShape: activeImage.shape,
    };
  }
);

export const selectSelectedActiveAnnotations = createSelector(
  [selectSelectedAnnotationIds, selectUpdatedObjects],
  (annotationIds, objects): Array<DecodedAnnotationObject> => {
    if (!annotationIds.length) return [];

    return annotationIds.map((annotationId) => {
      const annotation = objects[annotationId] as AnnotationObject;
      const decodedAnnotation = !annotation.decodedMask
        ? decodeAnnotation(annotation)
        : (annotation as DecodedAnnotationObject);
      return decodedAnnotation;
    });
  }
);

export const selectImageViewerObjects = createSelector(
  selectImagesArray,
  selectUpdatedObjects,
  (images, objects) => {
    const annotationObjects: AnnotationObject[] = [];
    for (const im of images) {
      const annIds = im.containing;
      for (const annId of annIds) {
        annotationObjects.push(objects[annId] as AnnotationObject);
      }
    }
    return annotationObjects;
  }
);

export const selectImageViewerObjectDict = createSelector(
  selectImagesArray,
  selectUpdatedObjects,
  (images, objects) => {
    const annotationObjects: Record<string, AnnotationObject> = {};
    for (const im of images) {
      const annIds = im.containing;
      for (const annId of annIds) {
        annotationObjects[annId] = objects[annId] as AnnotationObject;
      }
    }
    return annotationObjects;
  }
);

export const selectSelectedAnnotations = createSelector(
  selectSelectedAnnotationIds,
  selectUpdatedObjects,
  (selectedAnnotationIds, thingsDict) => {
    return selectedAnnotationIds.reduce(
      (anns: DecodedAnnotationObject[], id) => {
        const ann = thingsDict[id] as AnnotationObject;
        if (ann) {
          const decodedAnn =
            ann.decodedMask === undefined
              ? decodeAnnotation(ann)
              : (ann as DecodedAnnotationObject);
          anns.push(decodedAnn);
        }
        return anns;
      },
      []
    );
  }
);
