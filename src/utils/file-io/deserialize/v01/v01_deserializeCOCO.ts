import { encode, maskFromPoints } from "views/ImageViewer/utils";

import { generateUUID } from "store/data/utils";
import { logger } from "utils/logUtils";
import {
  V01_AnnotationObject,
  V01_Category,
  V01_ImageObject,
  SerializedCOCOAnnotationType,
  SerializedCOCOCategoryType,
  SerializedCOCOFileType,
  SerializedCOCOImageType,
} from "../../types";
import { Point } from "utils/types";

/*
We want to match incoming categories to existing categories, if their names are the same,
however their ids may differ. We can't change existing category ids because existing annotations
refer to them. Instead we have to ensure incoming categories are given the proper ids, and then
change the incoming annotations to refer to the updated incoming category id
*/
const reconcileCOCOCategories = (
  existingCategories: Array<V01_Category>,
  serializedCategories: Array<SerializedCOCOCategoryType>,
  serializedAnnotations: Array<SerializedCOCOAnnotationType>,
  availableColors: Array<string> = [],
) => {
  if (availableColors.length === 0) {
    availableColors = ["#000000"];
  }
  // incoming cat id -> existing cat id
  const catIdMap: { [catId: string]: string } = {};

  let colorIdx = -1;

  const matchedCats: typeof serializedCategories = [];
  const newCats: typeof existingCategories = [];

  for (const cocoCat of serializedCategories) {
    const existingCat = existingCategories.find((c) => c.name === cocoCat.name);

    if (existingCat) {
      // map to existing id
      catIdMap[cocoCat.id] = existingCat.id;
      matchedCats.push(cocoCat);
    } else {
      // no matching category exists, create one
      const newCat = {
        id: generateUUID(),
        name: cocoCat.name,
        visible: true,
        // keep cycling through available colors
        color: availableColors[++colorIdx % availableColors.length],
      };

      catIdMap[cocoCat.id] = newCat.id;
      newCats.push(newCat);
    }
  }

  const catModdedAnnotations = serializedAnnotations.map((ann) => ({
    ...ann,
    category_id: catIdMap[ann.category_id],
  }));

  if (
    import.meta.env.NODE_ENV !== "production" &&
    import.meta.env.VITE_APP_LOG_LEVEL === "1"
  ) {
    const numMatched = matchedCats.length;
    const numNew = newCats.length;
    const numExisting = existingCategories.length;
    const numUnmatched = numExisting - numMatched;

    numMatched !== numExisting &&
      logger(
        `Categories matched: ${numMatched}, newly created: ${numNew}, unmatched: ${numUnmatched}`,
      );
  }

  return { newCats, catModdedAnnotations };
};

/*
We want to match incoming images to existing images, where their names are the same,
however their ids may differ. We can't change existing image ids because existing components
may refer to them. Instead we have to ensure incoming images are given the proper ids, and then
change the incoming annotations to refer to the updated incoming image id.

If the image doesn't exist, then there's nothing to assign the annotation to, and it is discarded.
*/
const reconcileImages = (
  existingImages: Array<V01_ImageObject>,
  serializedImages: Array<SerializedCOCOImageType>,
  // reconcileCOCOCategories changes 'category_id' type
  serializedAnnotations: Array<
    Omit<SerializedCOCOAnnotationType, "category_id"> & { category_id: string }
  >,
) => {
  // incoming image id -> existing image id
  const imIdMap: { [imId: string]: string } = {};

  const discardedAnnotations: typeof serializedAnnotations = [];
  const discardedIms: typeof serializedImages = [];
  const matchedIms: typeof existingImages = [];

  for (const cocoIm of serializedImages) {
    const existingIm = existingImages.find((i) => i.name === cocoIm.file_name);
    if (existingIm) {
      // save id mapping
      imIdMap[cocoIm.id] = existingIm.id;
      // save refrence to modded image
      matchedIms.push(existingIm);
    } else {
      // discard match-less images
      discardedIms.push(cocoIm);
    }
  }

  const imModdedAnnotations = serializedAnnotations
    .filter((ann) => {
      if (imIdMap.hasOwnProperty(ann.image_id)) {
        return true;
      } else {
        // discarde image-less annotatiosn
        discardedAnnotations.push(ann);
        return false;
      }
    })
    .map((ann) => ({ ...ann, image_id: imIdMap[ann.image_id] }));

  if (
    import.meta.env.NODE_ENV !== "production" &&
    import.meta.env.VITE_APP_LOG_LEVEL === "1"
  ) {
    const numImsDiscarded = discardedIms.length;
    const numAnnsDiscarded = discardedAnnotations.length;
    const numImsModded = matchedIms.length;
    const numImsExisting = existingImages.length;
    const numAnnsKept = imModdedAnnotations.length;

    numImsDiscarded > 0 &&
      logger([
        `Discarded ${numImsDiscarded} / ${numImsExisting} COCO images`,
        `and ${numAnnsDiscarded} associated annotations.`,
        `Image names: ${discardedIms.map((im) => im.file_name)}`,
        `Annotation ids: ${discardedAnnotations.map((ann) => ann.id)}`,
      ]);
    numImsModded > 0 &&
      logger([
        `Matched ${numImsModded} / ${numImsExisting} COCO images`,
        `with ${numAnnsKept} associated annotations`,
      ]);
  }

  return { matchedIms, imModdedAnnotations };
};

export const v01_deserializeCOCOFile = (
  cocoFile: SerializedCOCOFileType,
  existingImages: Array<V01_ImageObject>,
  existingCategories: Array<V01_Category>,
  availableColors: Array<string> = [],
) => {
  // this must come first
  const { newCats, catModdedAnnotations } = reconcileCOCOCategories(
    existingCategories,
    cocoFile.categories,
    cocoFile.annotations,
    availableColors,
  );

  // this must come second
  const { matchedIms, imModdedAnnotations } = reconcileImages(
    existingImages,
    cocoFile.images,
    catModdedAnnotations,
  );

  const crowded: Array<number> = [];
  const multipart: Array<number> = [];
  const malformed: Array<number> = [];

  const encodedAnnotations: Array<V01_AnnotationObject> = [];

  for (const cocoAnn of imModdedAnnotations) {
    const parentIm = matchedIms.find((im) => im.id === cocoAnn.image_id);

    if (!parentIm) {
      if (import.meta.env.NODE_ENV !== "production") {
        console.error(
          "Somehow received an imageless annotation that was not filtered out",
        );
      }
      continue;
    }

    if (cocoAnn.iscrowd) {
      crowded.push(cocoAnn.id);
      continue;
    }

    // will be number[][] when iscrowd is false
    const polygons = cocoAnn.segmentation as number[][];

    const numPolygons = polygons.length;

    if (numPolygons !== 1) {
      multipart.push(cocoAnn.id);
      continue;
    }

    // coco polygon points are arranged as: [x_1, y_1, x_2, y_2, ...]
    // where y_1 and x_1 are the y,x coordinates of point 1
    const polygon = polygons[0];

    if (polygon.length % 2 !== 0) {
      malformed.push(cocoAnn.id);
      continue;
    }

    const points: Point[] = [];
    for (let i = 0; i < polygon.length; i += 2) {
      points.push({ x: polygon[i], y: polygon[i + 1] });
    }

    // convert coco [x, y, width, height] to our [x1, y1, x2, y2]
    const bbox = [
      Math.round(cocoAnn.bbox[0]),
      Math.round(cocoAnn.bbox[1]),
      Math.round(cocoAnn.bbox[0] + cocoAnn.bbox[2]),
      Math.round(cocoAnn.bbox[1] + cocoAnn.bbox[3]),
    ] as [number, number, number, number];

    const decodedMask = maskFromPoints(
      points,
      { width: parentIm.shape.width, height: parentIm.shape.height },
      bbox,
      true,
    );

    const encodedMask = encode(decodedMask);

    const newAnnotation = {
      id: generateUUID(),
      encodedMask: encodedMask,
      plane: parentIm.activePlane,
      boundingBox: bbox,
      categoryId: cocoAnn.category_id,
      imageId: parentIm.id,
    };

    encodedAnnotations.push(newAnnotation);
  }

  if (
    import.meta.env.NODE_ENV !== "production" &&
    import.meta.env.VITE_APP_LOG_LEVEL === "1"
  ) {
    const numMalformed = malformed.length;
    const numCrowded = crowded.length;
    const numMultipart = multipart.length;
    const numInFile = cocoFile.annotations.length;
    const numKept = numInFile - (numMalformed + numCrowded + numMultipart);

    malformed.length > 0 &&
      logger(
        `Dropped ${malformed.length} annotations with malformed polygon shapes: ${malformed}`,
      );
    crowded.length > 0 &&
      logger(`Dropped ${crowded.length} annotations with iscrowd=1`);
    multipart.length > 0 &&
      logger(
        `Dropped ${multipart.length} annotations with multiple polygon parts`,
      );
    logger(`Created ${numKept}/${numInFile} annotations`);
  }

  return {
    annotations: encodedAnnotations,
    newCategories: newCats,
  };
};
