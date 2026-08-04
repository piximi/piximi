import type { AnnotationObject, ImageObject, Kind } from "store/dataV2/types";
import { generateUUID } from "store/dataV2/utils";

import { Partition } from "utils/dl/enums";

import { encode } from "./rle";

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
