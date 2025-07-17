import { createSelector } from "@reduxjs/toolkit";
import { difference } from "lodash";

import {
  selectAnnotationChanges,
  selectCategoryChanges,
  selectKindChanges,
  selectSelectedAnnotationIds,
  selectThingChanges,
  selectWorkingAnnotationEntity,
} from "./selectors";
import {
  selectAnnotationDictionary,
  selectLocalizedAnnotationDict,
  selectObjectCategoryDict,
  selectObjectDict,
  selectObjectKindDict,
} from "store/data/selectors";

import { decodeAnnotation } from "views/ImageViewer/utils/rle";
import { getCompleteEntity } from "./utils";

import {
  AnnotationObject,
  Category,
  Kind,
  Shape,
  TSAnnotationObject,
} from "store/data/types";
import { ProtoAnnotationObject } from "views/ImageViewer/utils/types";
import {
  selectActiveImage,
  selectImageSeriesArray,
} from "../imageViewer/reselectors";
import { selectActiveImageSeries } from "../imageViewer/selectors";

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

export const selectUpdatedActiveAnnotationDict = createSelector(
  selectActiveImageSeries,
  selectLocalizedAnnotationDict,
  selectAnnotationChanges,
  (activeImageSeries, getLocalAnnotationsDict, annotationChanges) => {
    if (!activeImageSeries) return {};
    const finalAnnotations = Object.values(annotationChanges.added).reduce(
      (
        finalLocalAnnotations: Record<string, ProtoAnnotationObject>,
        annotation,
      ) => {
        if (
          annotation.plane === activeImageSeries.activePlane &&
          annotation.timepoint === activeImageSeries.activeTimepoint &&
          annotation.imageId === activeImageSeries.id
        )
          finalLocalAnnotations[annotation.id] = annotation;
        return finalLocalAnnotations;
      },
      {},
    );

    const localAnnotations = getLocalAnnotationsDict(
      activeImageSeries.id,
      activeImageSeries.activePlane,
      activeImageSeries.activeTimepoint,
    );
    const remainingAnnotations = difference(
      Object.keys(localAnnotations),
      annotationChanges.deleted,
    );

    for (const annotationId of remainingAnnotations) {
      const annotation = decodeAnnotation(localAnnotations[annotationId]);

      if (annotationChanges.edited[annotationId]) {
        finalAnnotations[annotationId] = {
          ...(annotation as ProtoAnnotationObject),
          ...annotationChanges.edited[annotationId],
        };
      } else {
        finalAnnotations[annotationId] = annotation as ProtoAnnotationObject;
      }
    }

    return finalAnnotations;
  },
);

export const selectUpdatedActiveAnnotations = createSelector(
  selectUpdatedActiveAnnotationDict,
  (annotationDict) => Object.values(annotationDict),
);

export const selectImageViewerObjects = createSelector(
  selectImageSeriesArray,
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

export const selectActiveAnnotationsViews = createSelector(
  selectActiveImage,
  selectUpdatedActiveAnnotations,
  selectImageViewerCategories,
  (activeImage, annotations, catDict) => {
    if (!activeImage) return [];
    const imageShape = activeImage.shape;
    const annotationObjects: Array<{
      annotation: ProtoAnnotationObject;
      fillColor: string;
      imageShape: Shape;
    }> = [];

    for (const annotation of annotations) {
      const fillColor = catDict[annotation.categoryId].color;
      annotationObjects.push({
        annotation: annotation,
        fillColor,
        imageShape: imageShape,
      });
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
