import { v4 as uuidv4 } from "uuid";

import { encode, maskFromPoints } from "utils/annotator";

import {
  Category,
  SerializedCOCOFileType,
  SerializedCOCOCategoryType,
  SerializedCOCOImageType,
  Point,
  ShadowImageType,
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

  const modifiedCategories: { [id: number]: Category } = {};
  const newCategories: { [id: number]: Category } = {};

  for (const cocoCategory of serializedCategories) {
    const matchingCat = existingCategories.find(
      (cat) => cat.name === cocoCategory.name
    );

    if (matchingCat) {
      modifiedCategories[cocoCategory.id] = matchingCat;
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
    process.env.NODE_ENV !== "development" &&
    process.env.REACT_APP_LOG_LEVEL === "1"
  ) {
    const numExisting = existingCategories.length;
    const numModified = Object.keys(modifiedCategories).length;
    const numNew = Object.keys(newCategories).length;
    const numUnmodified = numExisting - (numNew + numModified);

    numModified !== numExisting &&
      console.log(
        `Categories modified: ${numModified}, created: ${numNew}, unmodified: ${numUnmodified}`
      );
  }

  return { modifiedCategories, newCategories };
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
    process.env.NODE_ENV !== "development" &&
    process.env.REACT_APP_LOG_LEVEL === "1"
  ) {
    unfound.length > 0 &&
      console.log(`Could not find ${unfound.length} images: ${unfound}`);
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

  const imageless: Array<number> = [];
  const catless: Array<number> = [];
  const discarded: Array<number> = [];

  for (const annotation of cocoFile.annotations) {
    const parentIm = imIdMap[annotation.image_id];
    const parentCat =
      catIdMap.modifiedCategories[annotation.category_id] ||
      catIdMap.newCategories[annotation.category_id];

    if (!parentIm) {
      imageless.push(annotation.id);
      continue;
    } else if (!parentCat) {
      catless.push(annotation.id);
      continue;
    } else if (annotation.iscrowd) {
      discarded.push(annotation.id);
      continue;
    }

    // will be number[][] when iscrowd is false
    const polygons = annotation.segmentation as number[][];

    const numPolygons = polygons.length;

    if (numPolygons !== 1) {
      throw new Error(
        `Unsupported number of polygons: annotation ${annotation.id} has ${numPolygons} polygons`
      );
    }

    // coco polygon points are arranged as: [y_1, x_1, y_2, x_2, ...]
    // where y_1 and x_1 are the y,x coordinates of point 1
    const polygon = polygons[0];
    const points: Point[] = [];
    for (let i = 0; i < polygon.length / 2; i += 2) {
      points.push({ y: polygon[i], x: polygon[i + 1] });
    }

    const maskData = maskFromPoints(
      points,
      { width: parentIm.shape.width, height: parentIm.shape.height },
      annotation.bbox
    );

    // TODO: COCO - probably should only do this if not being assigned to active image
    const encodedMask = encode(maskData);

    parentIm.annotations.push({
      id: uuidv4(),
      mask: encodedMask,
      plane: parentIm.activePlane,
      boundingBox: annotation.bbox,
      categoryId: parentCat.id,
    });
  }

  if (
    process.env.NODE_ENV !== "development" &&
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
  }

  return {
    modifiedImages: Object.values(imIdMap),
    modifiedCategories: Object.values(catIdMap.modifiedCategories),
    newCategories: Object.values(catIdMap.newCategories),
  };
};
