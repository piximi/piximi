import { createSelector } from "@reduxjs/toolkit";
import { difference } from "lodash";

import {
  selectCategoryChanges,
  selectKindChanges,
  selectSelectedAnnotationIds,
  selectThingChanges,
  selectImageChanges,
  selectWorkingAnnotationEntity,
  selectAnnotationChanges,
} from "./selectors";
import {
  selectObjectCategoryDict,
  selectObjectDict,
  selectObjectKindDict,
  selectThingsDictionary,
  selectImageDictionary,
  selectAnnotationDictionary,
} from "store/data/selectors";
import {
  selectActiveImageId,
  selectImageStackImageIds,
} from "../imageViewer/selectors";

import { decodeAnnotation } from "views/ImageViewer/utils/rle";
import { generateBlankColors } from "utils/tensorUtils";
import { getCompleteEntity } from "./utils";

import {
  AnnotationObject,
  Category,
  ImageObject,
  Kind,
  Shape,
  TSImageObject,
} from "store/data/types";
import { Colors, ColorsRaw } from "utils/types";
import { ProtoAnnotationObject } from "views/ImageViewer/utils/types";

export const selectImageViewerImages = createSelector(
  selectImageStackImageIds,
  selectImageDictionary,
  selectAnnotationChanges,
  selectImageChanges,
  (imageIds, images, imageChanges) => {
    const updatedImages: Record<string, ImageObject> = {};

    for (const imageId of Object.keys(imageIds)) {
      const image = images[imageId] as TSImageObject;
      let finalImage = { ...image };
      if (imageChanges.edited[imageId]) {
        const { id: _id, ...imageChanges } = imageChanges.edited[imageId];

        finalImage = { ...finalImage, ...imageChanges };
      }
      finalImage.containing = difference(
        finalImage.containing,
        imageChanges.deleted,
      );
      finalImage.containing.push(...(newObjectsByImage[imageId] ?? []));
      updatedImages[imageId] = finalImage;
    }

    return updatedImages;
  },
);

export const selectImagesArray = createSelector(
  selectImageViewerImages,
  (images) => Object.values(images),
);

export const selectActiveImage = createSelector(
  selectActiveImageId,
  selectImageViewerImages,
  (activeImageId, images) =>
    activeImageId ? images[activeImageId] : undefined,
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
  },
);

export const selectActiveImageObjectIds = createSelector(
  selectActiveImage,
  (activeImage) => activeImage?.containing ?? [],
);

export const selectImageViewerKinds = createSelector(
  selectObjectKindDict,
  selectKindChanges,
  (rootKinds, kindChanges): Record<string, Kind> => {
    const finalKinds: Record<string, Kind> = { ...kindChanges.added };
    const remainingKinds = difference(
      Object.keys(rootKinds),
      kindChanges.deleted,
    );
    for (const kindId of remainingKinds) {
      const kind = rootKinds[kindId];
      if (!(kind.id in kindChanges.edited)) {
        finalKinds[kind.id] = kind;
        continue;
      }
      const {
        categories: editedCategories,
        containing: editedThings,
        ...editedKind
      } = kindChanges.edited[kind.id];
      let updatedCategories = [...kind.categories];
      let updatedThings = [...kind.containing];
      if (editedCategories) {
        updatedCategories.push(...editedCategories.added);
        updatedCategories = difference(
          updatedCategories,
          editedCategories.deleted,
        );
      }
      if (editedThings) {
        updatedThings.push(...editedThings.added);
        updatedThings = difference(updatedThings, editedThings.deleted);
      }
      finalKinds[kind.id] = {
        ...kind,
        ...editedKind,
        categories: updatedCategories,
        containing: updatedThings,
      };
    }
    return finalKinds;
  },
);

export const selectKindsArray = createSelector(
  selectImageViewerKinds,
  (kinds) => Object.values(kinds),
);
export const renderImageViewerKindName = createSelector(
  selectImageViewerKinds,
  (kinds) => (kindId: string) => kinds[kindId].displayName,
);

export const selectImageViewerCategories = createSelector(
  selectObjectCategoryDict,
  selectCategoryChanges,
  (rootCategories, categoryChanges): Record<string, Category> => {
    const finalCategories = { ...categoryChanges.added };
    const remainingCategories = difference(
      Object.values(rootCategories).map((c) => c.id),
      categoryChanges.deleted,
    );
    for (const categoryId of remainingCategories) {
      const category = rootCategories[categoryId];
      if (!(category.id in categoryChanges.edited)) {
        finalCategories[category.id] = category;
        continue;
      }
      const { containing: editedThings, ...editedCategory } =
        categoryChanges.edited[category.id];
      let updatedThings = [...category.containing];
      if (editedThings) {
        updatedThings.push(...editedThings.added);

        updatedThings = difference(updatedThings, editedThings.deleted);
      }
      finalCategories[category.id] = {
        ...category,
        ...editedCategory,
        containing: updatedThings,
      };
    }
    return finalCategories;
  },
);

export const selectCategoriesArray = createSelector(
  selectImageViewerCategories,
  (categories) => Object.values(categories),
);

export const selectCategoriesByKind = createSelector(
  selectKindsArray,
  selectImageViewerCategories,
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
  },
);

export const selectCategoriesByKindArray = createSelector(
  selectCategoriesByKind,
  (catsByKind) => Object.values(catsByKind),
);

export const selectUpdatedObjects = createSelector(
  selectObjectDict,
  selectThingChanges,
  (thingsDict, thingChanges) => {
    const finalThings: Record<string, ProtoAnnotationObject> = {
      ...thingChanges.added,
    };
    const remainingThings = difference(
      Object.keys(thingsDict),
      thingChanges.deleted,
    );

    for (const thingId of remainingThings) {
      const thing = decodeAnnotation(thingsDict[thingId]);

      if (thingChanges.edited[thingId]) {
        finalThings[thingId] = {
          ...(thing as ProtoAnnotationObject),
          ...thingChanges.edited[thingId],
        };
      } else {
        finalThings[thingId] = thing as ProtoAnnotationObject;
      }
    }

    return finalThings;
  },
);

export const selectImageViewerObjects = createSelector(
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
  },
);

export const selectImageViewerObjectsArray = createSelector(
  selectImageViewerObjects,
  (objects) => {
    return Object.values(objects);
  },
);

export const selectFullWorkingAnnotation = createSelector(
  selectWorkingAnnotationEntity,

  (workingAnnotationEntity) => {
    if (!workingAnnotationEntity.saved) return;
    return {
      ...workingAnnotationEntity.saved,
      ...workingAnnotationEntity.changes,
    } as ProtoAnnotationObject;
  },
);

export const selectActiveAnnotations = createSelector(
  [selectActiveImage, selectUpdatedObjects],
  (activeImage, objects): Record<string, ProtoAnnotationObject> => {
    const activeAnnotationDict: Record<string, ProtoAnnotationObject> = {};
    if (!activeImage) return activeAnnotationDict;
    activeImage.containing.forEach((annotationId) => {
      activeAnnotationDict[annotationId] = objects[annotationId];
    });

    return activeAnnotationDict;
  },
);

export const selectActiveAnnotationsArray = createSelector(
  selectActiveAnnotations,
  (activeAnnotationDict): Array<ProtoAnnotationObject> => {
    return Object.values(activeAnnotationDict);
  },
);

export const selectActiveAnnotationsViews = createSelector(
  selectActiveImage,
  selectUpdatedObjects,
  selectImageViewerCategories,
  (activeImage, objects, catDict) => {
    if (!activeImage) return [];
    const imageShape = activeImage.shape;
    const activePlane = activeImage.activePlane;
    const annotationObjects: Array<{
      annotation: ProtoAnnotationObject;
      fillColor: string;
      imageShape: Shape;
    }> = [];

    for (const annotationId of activeImage.containing) {
      const annotation = objects[annotationId];

      if (
        annotation.plane === activePlane ||
        annotation.activePlane === activePlane
      ) {
        const fillColor = catDict[annotation.categoryId].color;
        annotationObjects.push({
          annotation: annotation,
          fillColor,
          imageShape: imageShape,
        });
      }
    }
    return annotationObjects;
  },
);
export const selectWorkingAnnotationView = createSelector(
  selectWorkingAnnotationEntity,
  selectActiveImage,
  selectImageViewerCategories,
  (workingAnnotationEntity, activeImage, catDict) => {
    if (!workingAnnotationEntity.saved || !activeImage) return;
    const workingAnnotation = getCompleteEntity(
      workingAnnotationEntity,
    ) as AnnotationObject;
    const annotation = !workingAnnotation.decodedMask
      ? decodeAnnotation(workingAnnotation)
      : (workingAnnotation as ProtoAnnotationObject);
    const fillColor = catDict[workingAnnotation.categoryId].color;
    return {
      annotation: annotation,
      fillColor: fillColor,
      imageShape: activeImage.shape,
    };
  },
);

export const selectSelectedActiveAnnotations = createSelector(
  [selectSelectedAnnotationIds, selectUpdatedObjects],
  (annotationIds, objects): Array<ProtoAnnotationObject> => {
    if (!annotationIds.length) return [];

    return annotationIds.map((annotationId) => {
      const annotation = objects[annotationId];
      return annotation;
    });
  },
);

export const selectSelectedAnnotations = createSelector(
  selectSelectedAnnotationIds,
  selectUpdatedObjects,
  (selectedAnnotationIds, thingsDict): ProtoAnnotationObject[] => {
    return selectedAnnotationIds.reduce((anns: ProtoAnnotationObject[], id) => {
      const ann = thingsDict[id];
      if (ann) {
        anns.push(ann);
      }
      return anns;
    }, []);
  },
);
