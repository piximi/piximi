import { onesLike, tidy, unique, whereAsync } from "@tensorflow/tfjs";
import { Image as ImageJS } from "image-js";

import { generateUUID, Partition } from "core/entities";

import { rleEncodeArray } from "utils/image";

import type { ColorModel } from "image-js";
import type { Tensor1D } from "@tensorflow/tfjs";

import type { PredictedAnnotationObject } from "../../types";

/*
 * Shared conversion from a flat instance-label mask to piximi annotations.
 *
 * Many segmenters (Cellpose, Cellpose-SAM, GlaS, ...) ultimately produce a
 * row-major label map where each pixel holds the integer id of the instance it
 * belongs to (0 = background). This module isolates a single label, computes
 * its bounding box, crops the binary mask to that box, and RLE-encodes it.
 */
const labelToAnnotation = async (
  labelMask: Tensor1D,
  label: number,
  maskH: number,
  maskW: number,
  kindName: string,
): Promise<PredictedAnnotationObject | undefined> => {
  const labelFilter = tidy(() => onesLike(labelMask).mul(label));

  // bool
  const isolatedMask = labelMask.equal(labelFilter);

  labelFilter.dispose();

  const result = await whereAsync(isolatedMask);

  // binary - 1 on label coords, 0 else
  const isolatedMaskData = await isolatedMask.data();
  isolatedMask.dispose();

  const occurenceIndices = result.flatten();

  result.dispose();

  const idxsArr = Array.from(occurenceIndices.dataSync());

  occurenceIndices.dispose();

  const getY = (idx: number) => Math.floor(idx / maskW);
  const getX = (idx: number) => idx % maskW;

  let minY = Infinity;
  let minX = Infinity;
  let maxX = 0;
  let maxY = 0;

  idxsArr.forEach((idx) => {
    const Y = getY(idx);
    const X = getX(idx);

    minY = Y < minY ? Y : minY;
    minX = X < minX ? X : minX;
    maxY = Y > maxY ? Y : maxY;
    maxX = X > maxX ? X : maxX;
  });

  const bbox = [minX, minY, maxX, maxY];

  const boxW = maxX - minX;
  const boxH = maxY - minY;

  if (boxH === 0 || boxW === 0) {
    return;
  }

  const maskImage = new ImageJS({
    width: maskW,
    height: maskH,
    data: isolatedMaskData,
    colorModel: "GREY" as ColorModel,
    alpha: 0,
    components: 1,
  });

  const annotationData = maskImage.crop({
    x: minX,
    y: minY,
    width: boxW,
    height: boxH,
  }).data;

  return {
    kindName: kindName,
    boundingBox: bbox as [number, number, number, number],
    encodedMask: rleEncodeArray(annotationData, true),
    partition: Partition.Unassigned,
    id: generateUUID(),
  };
};

export const labelMaskToAnnotation = async (
  labelMask: Tensor1D,
  maskH: number,
  maskW: number,
  kindName: string,
) => {
  const { values, indices } = unique(labelMask);

  const labels = values.dataSync();

  indices.dispose();
  values.dispose();

  const annotations: Array<PredictedAnnotationObject> = [];

  for (const label of labels) {
    if (label !== 0) {
      const annotation = await labelToAnnotation(
        labelMask,
        label,
        maskH,
        maskW,
        kindName,
      );
      if (annotation) {
        annotations.push(annotation);
      }
    }
  }

  labelMask.dispose();

  return annotations;
};
