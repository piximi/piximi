import { Image as IJSImage } from "image-js-latest";

import type {
  DataArray,
  AnnotationObject,
  ImageObject,
  Kind,
} from "store/dataV2/types";
import { generateUUID } from "store/dataV2/utils";

import { convertToDataArray } from "utils/dataUtils";
import { Partition } from "utils/dl/enums";

import { AnnotationMode } from "./enums";
import { encode } from "./rle";

import type { AnnotationTool } from "./tools";
import type { WorkingAnnotation } from "./types";

/**
 * Checks if a point lies within an annotation bounding box
 * @param x x-coord of point
 * @param y y-coord of point
 * @param boundingBox Bounding box of annotation
 * @returns true if point lies within the bounding box, false otherwise
 */
export const isInBoundingBox = (
  x: number,
  y: number,
  boundingBox: [number, number, number, number],
) => {
  if (x < 0 || y < 0) return false;
  if (x >= boundingBox[2] - boundingBox[0]) return false;
  if (y >= boundingBox[3] - boundingBox[1]) return false;
  return true;
};

export const createAnnotation = async (
  partialAnnotation: WorkingAnnotation,
  activeImage: ImageObject,
  kindObject: Kind,
) => {
  const bbox = partialAnnotation.boundingBox;

  const bitDepth = activeImage.bitDepth;

  const shape = {
    planes: 1,
    height: bbox[3] - bbox[1],
    width: bbox[2] - bbox[0],
    channels: activeImage.shape.channels,
  };

  const encodedMask = encode(partialAnnotation.decodedMask);

  const annotationId = generateUUID();
  const volumeId = generateUUID();
  return {
    ...partialAnnotation,
    bitDepth,
    shape,
    kind: kindObject.id,
    id: annotationId,
    encodedMask,
    volumeId,
    partition: Partition.Inference,
  } as AnnotationObject;
};

export const editProtoAnnotation = async (
  workingAnnotation: WorkingAnnotation,
  annotationMode: AnnotationMode,
  annotationTool: AnnotationTool,
): Promise<WorkingAnnotation> => {
  let combinedMask, combinedBoundingBox;

  if (annotationMode === AnnotationMode.Add) {
    [combinedMask, combinedBoundingBox] = annotationTool.add(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else if (annotationMode === AnnotationMode.Subtract) {
    [combinedMask, combinedBoundingBox] = annotationTool.subtract(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else if (annotationMode === AnnotationMode.Intersect) {
    [combinedMask, combinedBoundingBox] = annotationTool.intersect(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else {
    return workingAnnotation;
  }

  annotationTool.decodedMask = combinedMask;
  annotationTool.boundingBox = combinedBoundingBox;

  const combinedSelectedAnnotation: WorkingAnnotation = {
    ...workingAnnotation,
    boundingBox: combinedBoundingBox,
    decodedMask: annotationTool.decodedMask,
  };

  return combinedSelectedAnnotation;
};

export const editAnnotation = (
  workingAnnotation: WorkingAnnotation,
  annotationMode: AnnotationMode,
  annotationTool: AnnotationTool,
): WorkingAnnotation => {
  let combinedMask, combinedBoundingBox;

  if (annotationMode === AnnotationMode.Add) {
    [combinedMask, combinedBoundingBox] = annotationTool.add(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else if (annotationMode === AnnotationMode.Subtract) {
    [combinedMask, combinedBoundingBox] = annotationTool.subtract(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else if (annotationMode === AnnotationMode.Intersect) {
    [combinedMask, combinedBoundingBox] = annotationTool.intersect(
      workingAnnotation.decodedMask!,
      workingAnnotation.boundingBox,
    );
  } else {
    return workingAnnotation;
  }

  annotationTool.decodedMask = combinedMask;
  annotationTool.boundingBox = combinedBoundingBox;

  const combinedSelectedAnnotation: WorkingAnnotation = {
    ...workingAnnotation,
    boundingBox: combinedBoundingBox,
    decodedMask: annotationTool.decodedMask,
  };

  return combinedSelectedAnnotation;
};

/**
 * Invert the selected annotation area
 * @param selectedMask
 * @param selectedBoundingBox
 * @returns Bounding box and encodedMask of the inverted annotation area
 */
export const invert = (
  selectedMask: DataArray,
  selectedBoundingBox: [number, number, number, number],
  imageWidth: number,
  imageHeight: number,
): [Uint8Array, [number, number, number, number]] => {
  const encodedMask = selectedMask;

  // Find min and max boundary points when computing the encodedMask.
  const invertedBoundingBox: [number, number, number, number] = [
    imageWidth,
    imageHeight,
    0,
    0,
  ];

  const invertedMask = new IJSImage(imageWidth, imageHeight, {
    colorModel: "GREY",
  });
  for (let x = 0; x < imageWidth; x++) {
    for (let y = 0; y < imageHeight; y++) {
      const x_encodedMask = x - selectedBoundingBox[0];
      const y_encodedMask = y - selectedBoundingBox[1];
      const value =
        encodedMask[
          x_encodedMask +
            y_encodedMask * (selectedBoundingBox[2] - selectedBoundingBox[0])
        ];
      if (
        value > 0 &&
        isInBoundingBox(x_encodedMask, y_encodedMask, selectedBoundingBox)
      ) {
        invertedMask.setPixel(x, y, [0]);
      } else {
        invertedMask.setPixel(x, y, [255]);
        if (x < invertedBoundingBox[0]) {
          invertedBoundingBox[0] = x;
        } else if (x > invertedBoundingBox[2]) {
          invertedBoundingBox[2] = x + 1;
        }
        if (y < invertedBoundingBox[1]) {
          invertedBoundingBox[1] = y;
        } else if (y > invertedBoundingBox[3]) {
          invertedBoundingBox[3] = y + 1;
        }
      }
    }
  }

  // Crop the encodedMask using the new bounding box.
  const croppedInvertedMask = invertedMask.crop({
    origin: { row: invertedBoundingBox[0], column: invertedBoundingBox[1] },
    width: invertedBoundingBox[2] - invertedBoundingBox[0],
    height: invertedBoundingBox[3] - invertedBoundingBox[1],
  });

  return [
    convertToDataArray(
      8,
      croppedInvertedMask.getRawImage().data as DataArray,
    ) as Uint8Array,
    invertedBoundingBox,
  ];
};
