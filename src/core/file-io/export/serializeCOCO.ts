import {
  padMask,
  findContours,
  simplifyPolygon,
  decodeRleArray,
} from "utils/image";
import { logger } from "utils/logUtils";

import type {
  ExportedAnnotation,
  SerializedCOCOAnnotationType,
  SerializedCOCOCategoryType,
  SerializedCOCOFileType,
  SerializedCOCOImageType,
} from "./types";

export const serializeCOCOFile = (
  annotations: Array<ExportedAnnotation>,
): SerializedCOCOFileType => {
  let imCount = 0;
  let catCount = 0;
  let annCount = 0;
  const imIdMap: { [internalImageId: string]: SerializedCOCOImageType } = {};

  const catIdMap: { [internalCategoryId: string]: SerializedCOCOCategoryType } =
    {};

  const serializedAnnotations: Array<SerializedCOCOAnnotationType> = [];

  for (const ann of annotations) {
    if (!(ann.imageId in imIdMap)) {
      imIdMap[ann.imageId] = {
        id: imCount++,
        width: ann.imageShape.width,
        height: ann.imageShape.height,
        file_name: ann.imageName,
        license: 0,
        flickr_url: "",
        coco_url: "",
        date_captured: "",
      };
    }
    if (!(ann.categoryId in catIdMap)) {
      catIdMap[ann.categoryId] = {
        id: catCount++,
        name: ann.category.name,
        supercategory: ann.kindName,
      };
    }
    const boxWidth = ann.boundingBox[2] - ann.boundingBox[0];
    const boxHeight = ann.boundingBox[3] - ann.boundingBox[1];

    const paddedMask = padMask(
      decodeRleArray(ann.encodedMask!),
      boxWidth,
      boxHeight,
    );
    // +2 to W, H to account for padding on mask
    const contours = findContours(paddedMask, boxWidth + 2, boxHeight + 2);
    const outerBorder = contours.find((b) => b.seqNum === 2);

    if (!outerBorder) {
      import.meta.env.NODE_ENV !== "production" &&
        logger(`Could not find outer border of annotation ${ann.id}`);
      throw new Error(
        `Could not determine contours of annotation belonging to image ${
          imIdMap[ann.imageId].file_name
        }`,
      );
    }

    const SIMPLIFY = false;

    // coco polygon points are arranged as: [x_1, y_1, x_2, y_2, ...]
    const outerBorderPoints = (
      SIMPLIFY ? simplifyPolygon(outerBorder.points) : outerBorder.points
    )
      // add x_1, y_1 coordinates of box to translate polygon
      // points to wrt to image, rather than wrt mask
      .map((p) => [p.x + ann.boundingBox[0], p.y + ann.boundingBox[1]])
      .flat();

    serializedAnnotations.push({
      id: annCount++,
      image_id: imIdMap[ann.imageId].id,
      category_id: catIdMap[ann.categoryId].id,
      segmentation: [outerBorderPoints],
      area: 0,
      // x1, y1, width, height
      bbox: [ann.boundingBox[0], ann.boundingBox[1], boxWidth, boxHeight],
      iscrowd: 0,
    });
  }

  const info = {
    year: new Date().getFullYear(),
    // provided in package.json scripts
    version: import.meta.env.VITE_APP_VERSION as string,
    description: "",
    contributor: "",
    url: "",
    date_created: "",
  };

  const licenses = [
    {
      id: 0,
      name: "",
      url: "",
    },
  ];

  return {
    info,
    images: Object.values(imIdMap),
    categories: Object.values(catIdMap),
    annotations: serializedAnnotations,
    licenses,
  };
};
