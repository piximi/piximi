import { v4 as uuidv4 } from "uuid";

import { encode, maskFromPoints } from "utils/annotator";

import {
  Category,
  SerializedCOCOFileType,
  SerializedCOCOCategoryType,
  SerializedCOCOImageType,
  Point,
  ShadowImageType,
  encodedAnnotationType,
} from "types";

const deserializeCOCOCategories = (
  serializedCategories: Array<SerializedCOCOCategoryType>,
  existingCategories: Array<Category>,
  availableColors: Array<string> = []
) => {
  if (availableColors.length === 0) {
    availableColors = ["#000000"];
  }

  let colorIdx = -1;

  const matchedCategories: { [id: number]: Category } = {};
  const newCategories: { [id: number]: Category } = {};

  for (const cocoCategory of serializedCategories) {
    const matchingCat = existingCategories.find(
      (cat) => cat.name === cocoCategory.name
    );

    if (matchingCat) {
      matchedCategories[cocoCategory.id] = matchingCat;
    } else {
      // no matching category exists, create one
      newCategories[cocoCategory.id] = {
        id: uuidv4(),
        name: cocoCategory.name,
        visible: true,
        // keep cycling through available colors
        color: availableColors[++colorIdx % availableColors.length],
      };
    }
  }

  if (
    process.env.NODE_ENV !== "production" &&
    process.env.REACT_APP_LOG_LEVEL === "1"
  ) {
    const numExisting = existingCategories.length;
    const numMatched = Object.keys(matchedCategories).length;
    const numNew = Object.keys(newCategories).length;
    const numUnmatched = numExisting - numMatched;

    numMatched !== numExisting &&
      console.log(
        `Categories matched: ${numMatched}, newly created: ${numNew}, unmatched: ${numUnmatched}`
      );
  }

  return { matchedCategories, newCategories };
};

const deserializeCOCOImages = (
  serializedImages: Array<SerializedCOCOImageType>,
  existingImages: Array<ShadowImageType>
) => {
  const imIdMap: { [id: number]: ShadowImageType } = {};
  const unfound: Array<string> = [];

  for (const cocoIm of serializedImages) {
    const matchingIm = existingImages.find(
      (im) => im.name === cocoIm.file_name
    );

    if (matchingIm) {
      imIdMap[cocoIm.id] = matchingIm;
    } else {
      unfound.push(cocoIm.file_name);
    }
  }

  if (
    process.env.NODE_ENV !== "production" &&
    process.env.REACT_APP_LOG_LEVEL === "1"
  ) {
    unfound.length > 0 &&
      console.log(
        `Could not find ${unfound.length}/${serializedImages.length} images: ${unfound}`
      );
    const found = Object.keys(imIdMap);
    found.length > 0 &&
      console.log(`Found ${found.length}/${serializedImages.length} images`);
  }

  return imIdMap;
};

export const deserializeCOCOFile = (
  cocoFile: SerializedCOCOFileType,
  existingImages: Array<ShadowImageType>,
  existingCategories: Array<Category>,
  availableColors: Array<string> = []
) => {
  const catIdMap = deserializeCOCOCategories(
    cocoFile.categories,
    existingCategories,
    availableColors
  );

  const imIdMap = deserializeCOCOImages(cocoFile.images, existingImages);

  const annotations: {
    [parentImId: string]: Array<encodedAnnotationType>;
  } = {};

  const imageless: Array<number> = [];
  const catless: Array<number> = [];
  const crowded: Array<number> = [];
  const multipart: Array<number> = [];
  let numKept: number = 0;

  for (const annotation of cocoFile.annotations) {
    const parentIm = imIdMap[annotation.image_id];
    const parentCat =
      catIdMap.matchedCategories[annotation.category_id] ||
      catIdMap.newCategories[annotation.category_id];

    if (!parentIm) {
      imageless.push(annotation.id);
      continue;
    } else if (!parentCat) {
      catless.push(annotation.id);
      continue;
    } else if (annotation.iscrowd) {
      crowded.push(annotation.id);
      continue;
    }

    // will be number[][] when iscrowd is false
    const polygons = annotation.segmentation as number[][];

    const numPolygons = polygons.length;

    if (numPolygons !== 1) {
      multipart.push(annotation.id);
      continue;
    }

    numKept += 1;

    // coco polygon points are arranged as: [y_1, x_1, y_2, x_2, ...]
    // where y_1 and x_1 are the y,x coordinates of point 1
    const polygon = polygons[0];
    const points: Point[] = [];
    for (let i = 0; i < polygon.length / 2; i += 2) {
      points.push({ y: polygon[i], x: polygon[i + 1] });
    }

    // convert coco [x, y, width, height] to our [x1, y1, x2, y2]
    const bbox = [
      Math.round(annotation.bbox[0]),
      Math.round(annotation.bbox[1]),
      Math.round(annotation.bbox[0] + annotation.bbox[2]),
      Math.round(annotation.bbox[1] + annotation.bbox[3]),
    ] as [number, number, number, number];

    const maskData = maskFromPoints(
      points,
      { width: parentIm.shape.width, height: parentIm.shape.height },
      bbox
    );

    // TODO: COCO - probably should only do this if not being assigned to active image
    const encodedMask = encode(maskData);

    const newAnnotation = {
      id: uuidv4(),
      mask: encodedMask,
      plane: parentIm.activePlane,
      boundingBox: bbox,
      categoryId: parentCat.id,
    };

    if (annotations.hasOwnProperty(parentIm.id)) {
      annotations[parentIm.id].push(newAnnotation);
    } else {
      annotations[parentIm.id] = [newAnnotation];
    }
  }

  if (
    process.env.NODE_ENV !== "production" &&
    process.env.REACT_APP_LOG_LEVEL === "1"
  ) {
    imageless.length > 0 &&
      console.log(
        `Could not associate ${imageless.length} annotations with images: ${imageless}`
      );
    catless.length > 0 &&
      console.log(
        `Could not associate ${catless.length} annotations with categories: ${catless}`
      );
    crowded.length > 0 &&
      console.log(`Dropped ${crowded.length} annotations with iscrowd=1`);
    multipart.length > 0 &&
      console.log(
        `Dropped ${multipart.length} annotations with multiple polygon parts`
      );
    console.log(
      `Created ${numKept}/${cocoFile.annotations.length} annotations`
    );
  }

  return {
    newAnnotations: annotations,
    newCategories: Object.values(catIdMap.newCategories),
  };
};
