import { tensor1d } from "@tensorflow/tfjs";

import { labelMaskToAnnotation } from "./labelMaskToAnnotation";

import type { Cellpose, SegmentInput, SegmentOptions } from "cellpose-js";

import type { PredictedAnnotationObject } from "../../types";

/*
 * Runs cellpose-js (Cellpose-SAM, ONNX Runtime Web + WebGPU) on a single image
 * and converts its instance-label map into piximi annotations.
 *
 * `cp.segment` returns `masks` as a row-major Uint32Array of length width*height
 * (0 = background). TFJS has no uint32 dtype, so we widen to Float32 (label ids
 * are small integers, well within Float32's exact-integer range) and reuse the
 * shared label-mask -> annotation conversion.
 */
export const predictCellposeSAM = async (
  cp: Cellpose,
  input: SegmentInput,
  kindName: string,
  options?: SegmentOptions,
): Promise<PredictedAnnotationObject[]> => {
  const res = await cp.segment(input, options);

  const maskTensor = tensor1d(new Float32Array(res.masks));

  return labelMaskToAnnotation(maskTensor, res.height, res.width, kindName);
};
