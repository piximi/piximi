import { decodeRleArray } from "utils/image/rle";

import { calculateCenterOfMass } from "./geometry";

import type {
  AnnotationObject,
  AnnotationVolume,
  BBox,
  ImageObject,
} from "core/entities";

import type { TrackInput } from "./types";

/**
 * Reduces each AnnotationVolume to what the trackers need. A volume spans one
 * AnnotationObject per z-plane, so its box is the union of the plane boxes and
 * its center is the mean of the plane centers weighted by plane mass.
 */
export const buildTrackInputs = (
  volumes: AnnotationVolume[],
  annotations: AnnotationObject[],
  images: Record<string, Pick<ImageObject, "timepoint">>,
): TrackInput[] => {
  const annotationsByVolume = new Map<string, AnnotationObject[]>();
  annotations.forEach((annotation) => {
    const planes = annotationsByVolume.get(annotation.volumeId) ?? [];
    planes.push(annotation);
    annotationsByVolume.set(annotation.volumeId, planes);
  });

  const inputs: TrackInput[] = [];
  volumes.forEach((volume) => {
    const planes = annotationsByVolume.get(volume.id);
    const timepoint = volume.timepoint ?? images[volume.imageId]?.timepoint;
    if (!planes || timepoint === undefined) return;

    const boundingBox = [...planes[0].boundingBox] as BBox;
    let totalMass = 0;
    let xSum = 0;
    let ySum = 0;

    planes.forEach((plane) => {
      const [x1, y1, x2, y2] = plane.boundingBox;
      boundingBox[0] = Math.min(boundingBox[0], x1);
      boundingBox[1] = Math.min(boundingBox[1], y1);
      boundingBox[2] = Math.max(boundingBox[2], x2);
      boundingBox[3] = Math.max(boundingBox[3], y2);

      const mask = plane.decodedMask ?? decodeRleArray(plane.encodedMask, true);
      const { x, y, mass } = calculateCenterOfMass(mask, x2 - x1);
      totalMass += mass;
      xSum += (x + x1) * mass;
      ySum += (y + y1) * mass;
    });

    inputs.push({
      id: volume.id,
      kindId: volume.kindId,
      timepoint,
      boundingBox,
      center:
        totalMass === 0
          ? {
              x: (boundingBox[0] + boundingBox[2]) / 2,
              y: (boundingBox[1] + boundingBox[3]) / 2,
            }
          : { x: xSum / totalMass, y: ySum / totalMass },
    });
  });

  return inputs;
};
