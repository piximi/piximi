import { createSelector } from "@reduxjs/toolkit";
import {
  selectAllKinds,
  selectCategoriesDictionary,
  selectKindDictionary,
  selectThingsDictionary,
} from "store/data/selectors";
import { generateBlankColors } from "utils/common/tensorHelpers";
import { Colors, ColorsRaw } from "utils/common/types";
import {
  AnnotationObject,
  Category,
  DecodedAnnotationObject,
  ImageObject,
  Kind,
  KindWithCategories,
  Shape,
} from "store/data/types";
import {
  selectActiveAnnotationIds,
  selectActiveImageId,
  selectImageStackImageIds,
  selectSelectedAnnotationIds,
  selectWorkingAnnotation,
} from "./selectors";
import { decodeAnnotation } from "utils/annotator/rle";
import { getCompleteEntity } from "store/entities/utils";
import { intersection } from "lodash";

export const selectActiveImage = createSelector(
  selectActiveImageId,
  selectThingsDictionary,
  (activeImageId, thingDict) => {
    if (!activeImageId) return undefined;
    return thingDict[activeImageId] as ImageObject | undefined;
  }
);

export const selectImageViewerImages = createSelector(
  selectImageStackImageIds,
  selectThingsDictionary,
  (imageStackIds, thingDict) => {
    const imageViewerImages = imageStackIds.reduce(
      (images: ImageObject[], id) => {
        const image = thingDict[id];
        if (image) {
          images.push(image as ImageObject);
        }
        return images;
      },
      []
    );
    return imageViewerImages;
  }
);
export const selectImageViewerImageDict = createSelector(
  selectImageStackImageIds,
  selectThingsDictionary,
  (imageStackIds, thingDict) => {
    const imageViewerImages = imageStackIds.reduce(
      (images: Record<string, ImageObject>, id) => {
        const image = thingDict[id];
        if (image) {
          images[id] = image as ImageObject;
        }
        return images;
      },
      {}
    );
    return imageViewerImages;
  }
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

export const selectSelectedAnnotations = createSelector(
  selectSelectedAnnotationIds,
  selectThingsDictionary,
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

export const selectActiveAnnotations = createSelector(
  [selectActiveAnnotationIds, selectThingsDictionary],
  (annotationIds, thingsDict): Array<DecodedAnnotationObject> => {
    if (!annotationIds.length) return [];

    return annotationIds.map((annotationId) => {
      const annotation = thingsDict[annotationId] as AnnotationObject;
      const decodedAnnotation = !annotation.decodedMask
        ? decodeAnnotation(annotation)
        : (annotation as DecodedAnnotationObject);
      return decodedAnnotation;
    });
  }
);

export const selectActiveAnnotationsViews = createSelector(
  selectActiveImage,
  selectActiveAnnotationIds,
  selectThingsDictionary,
  selectCategoriesDictionary,
  (activeImage, activeAnnotationIds, thingDict, catDict) => {
    if (!activeImage) return [];
    const imageShape = activeImage.shape;
    const activePlane = activeImage.activePlane;
    const annotationObjects: Array<{
      annotation: DecodedAnnotationObject;
      fillColor: string;
      imageShape: Shape;
    }> = [];

    for (const annotationId of activeAnnotationIds) {
      const annotation = thingDict[annotationId] as AnnotationObject;

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
  selectWorkingAnnotation,
  selectActiveImage,
  selectCategoriesDictionary,
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
  [selectSelectedAnnotationIds, selectThingsDictionary],
  (annotationIds, thingsDict): Array<DecodedAnnotationObject> => {
    if (!annotationIds.length) return [];

    return annotationIds.map((annotationId) => {
      const annotation = thingsDict[annotationId] as AnnotationObject;
      const decodedAnnotation = !annotation.decodedMask
        ? decodeAnnotation(annotation)
        : (annotation as DecodedAnnotationObject);
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
  (activeImage, kindDict) => (category: Category, kindIfUnknown?: string) => {
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

export const selectImageViewerObjects = createSelector(
  selectImageStackImageIds,
  selectThingsDictionary,
  (imageIds, thingDict) => {
    const objects: AnnotationObject[] = [];
    for (const imId of imageIds) {
      const annIds = (thingDict[imId] as ImageObject).containing;
      for (const annId of annIds) {
        objects.push(thingDict[annId] as AnnotationObject);
      }
    }
    return objects;
  }
);

export const selectImageViewerObjectDict = createSelector(
  selectImageStackImageIds,
  selectThingsDictionary,
  (imageIds, thingDict) => {
    const objects: Record<string, AnnotationObject> = {};
    for (const imId of imageIds) {
      const annIds = (thingDict[imId] as ImageObject).containing;
      for (const annId of annIds) {
        objects[annId] = thingDict[annId] as AnnotationObject;
      }
    }
    return objects;
  }
);
