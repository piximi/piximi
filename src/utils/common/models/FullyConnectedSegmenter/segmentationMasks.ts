//@ts-ignore
import { v4 as uuidv4 } from "uuid";

import { decode } from "utils/annotator";
import { AnnotationType, Category, Shape, DecodedAnnotationType } from "types";

export const encodeAnnotationToSegmentationMask = (
  annotations: AnnotationType[],
  imageShape: Shape,
  createdCategoriesIDs: Array<string>
) => {
  const imageWidth = imageShape.width;
  const imageHeight = imageShape.height;

  const segmentationMask: Array<Array<Array<number>>> = Array.from(
    Array(imageHeight),
    () =>
      Array.from(Array(imageWidth), () =>
        Array(createdCategoriesIDs.length + 1).fill(0)
      )
  );

  annotations.forEach((annotation) => {
    // Get the index of the annotation: 0 := background, 1 := first created category, ...
    const annotationIndex =
      createdCategoriesIDs.findIndex((id) => id === annotation.categoryId) + 1;
    // Get the binary annotation mask from the run-length encoded annotation.
    const decodedAnnotation = decode(annotation.mask!);

    const x1 = annotation.boundingBox[0];
    const y1 = annotation.boundingBox[1];

    const width = annotation.boundingBox[2] - annotation.boundingBox[0];
    const height = annotation.boundingBox[3] - annotation.boundingBox[1];

    // Iterate over the annotation bounding box.
    for (let i = 0; i <= height; i++) {
      for (let j = 0; j <= width; j++) {
        const imgI = y1 + i;
        const imgJ = x1 + j;
        const maskIdx = i * width + j;
        if (decodedAnnotation[maskIdx] === 255) {
          segmentationMask[imgI][imgJ][annotationIndex] = 1;
          // Set the background to zero.
          segmentationMask[imgI][imgJ][0] = 0;
        }
      }
    }
  });

  return segmentationMask;
};

export const decodeSegmentationMaskToAnnotations = (
  createdCategories: Array<Category>,
  segmentationMask: Array<Array<number>>,
  imageShape: Shape
) => {
  const annotations: Array<DecodedAnnotationType> = [];

  const segmentationMasks: Array<Array<Array<number>>> = Array.from(
    Array(createdCategories.length),
    () =>
      Array.from(Array(imageShape.height), () =>
        Array(imageShape.width).fill(0)
      )
  );

  const xCoordinates: Array<Array<number>> = Array.from(
    Array(createdCategories.length),
    () => []
  );

  const yCoordinates: Array<Array<number>> = Array.from(
    Array(createdCategories.length),
    () => []
  );

  // Iterate over the predicted segmentation mask.
  for (let i = 0; i < imageShape.height; i++) {
    for (let j = 0; j < imageShape.width; j++) {
      for (let k = 0; k < createdCategories.length; k++) {
        if (segmentationMask[i][j] === k + 1) {
          xCoordinates[k].push(j);
          yCoordinates[k].push(i);
          segmentationMasks[k][i][j] = 255;
        } else {
          segmentationMasks[k][i][j] = 0;
        }
      }
    }
  }

  // Iterate over all categories and construct the annotations.
  createdCategories.forEach((category, k) => {
    // Check if there is an annotation for the current category.
    if (xCoordinates[k].length) {
      const x1 = Math.min(...xCoordinates[k]);
      const y1 = Math.min(...yCoordinates[k]);
      const x2 = Math.max(...xCoordinates[k]);
      const y2 = Math.max(...yCoordinates[k]);

      // Crop the bounding box in the segmentation mask.
      const croppedMask = segmentationMasks[k]
        .slice(x1, x2 + 1)
        .map((row) => row.slice(y1, y2 + 1));

      // Create the run-length encoding of the cropped segmentation mask.
      const flattenedMask = croppedMask.flat(2) as unknown as Uint8Array;

      annotations.push({
        boundingBox: [x1, y1, x2, y2],
        categoryId: category.id,
        id: uuidv4(),
        maskData: flattenedMask,
        plane: 0,
      });
    }
  });

  return annotations;
};
