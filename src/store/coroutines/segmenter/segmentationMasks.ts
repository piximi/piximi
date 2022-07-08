import { decode, encode } from "annotator/image/rle";
import { AnnotationType } from "types/AnnotationType";
import { Category } from "types/Category";
import { Shape } from "types/Shape";
import { v4 as uuidv4 } from "uuid";

export const encodeAnnotationsToSegmentationMask = (
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
    const decodedAnnotation = decode(annotation.mask);

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

export const encodeSegmentationMask = (
  createdCategories: Array<Category>,
  segmentationMask: Array<Array<number>>,
  imageShape: Shape
) => {
  const annotations: Array<AnnotationType> = [];

  createdCategories.forEach((category, idx) => {
    // The index of the i-th created category is i+1, 0 represents background.
    const segmentationMaskIdx = idx + 1;

    const mask = [];
    const xCoordinates = [];
    const yCoordinates = [];
    for (let i = 0; i < imageShape.height; i++) {
      for (let j = 0; j < imageShape.width; j++) {
        if (segmentationMask[i][j] === segmentationMaskIdx) {
          xCoordinates.push(j);
          yCoordinates.push(i);
          mask.push(255);
        } else {
          mask.push(0);
        }
      }
    }

    if (xCoordinates.length) {
      const x1 = Math.min(...xCoordinates);
      const y1 = Math.min(...yCoordinates);
      const x2 = Math.max(...xCoordinates);
      const y2 = Math.max(...yCoordinates);
      annotations.push({
        boundingBox: [x1, y1, x2, y2],
        categoryId: category.id,
        id: uuidv4(),
        mask: encode(new Uint8Array(mask)),
        plane: 0,
      });
    }
  });

  return annotations;
};
