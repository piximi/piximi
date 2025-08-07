import {
  Tensor1D,
  Tensor4D,
  onesLike,
  tensor1d,
  tidy,
  unique,
  whereAsync,
} from "@tensorflow/tfjs";
import { ColorModel, Image as ImageJS } from "image-js";

import { encode } from "views/ImageViewer/utils";
import { OrphanedAnnotationObject } from "../AbstractSegmenter/AbstractSegmenter";
import { generateUUID } from "store/data/utils";
import { Partition } from "../../enums";

const labelToAnnotation = async (
  labelMask: Tensor1D,
  label: number,
  maskH: number,
  maskW: number,
  kindId: string,
  unknownCategoryId: string,
): Promise<OrphanedAnnotationObject> => {
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
    kind: kindId,
    categoryId: unknownCategoryId,
    boundingBox: bbox as [number, number, number, number],
    encodedMask: encode(annotationData, true),
    activePlane: 0,
    partition: Partition.Unassigned,
    id: generateUUID(),
  };
};

const labelMaskToAnnotation = async (
  labelMask: Tensor1D,
  maskH: number,
  maskW: number,
  kindId: string,
  unknownCategoryId: string,
) => {
  const { values, indices } = unique(labelMask);

  const labels = values.dataSync();

  indices.dispose();
  values.dispose();

  const annotations: Array<OrphanedAnnotationObject> = [];

  for (const label of labels) {
    if (label !== 0) {
      const annotation = await labelToAnnotation(
        labelMask,
        label,
        maskH,
        maskW,
        kindId,
        unknownCategoryId,
      );
      annotations.push(annotation);
    }
  }

  labelMask.dispose();

  return annotations;
};

export const predictCellpose = async (
  // [B, H, W, C]
  imTensor: Tensor4D,
  fgKindId: string,
  unknownCategoryId: string,
  triton: any,
) => {
  const reshapedIm = tidy(() =>
    imTensor
      .reshape([imTensor.shape[1], imTensor.shape[2], imTensor.shape[3]])
      .transpose([2, 0, 1]),
  );

  imTensor.dispose();

  const imData = await reshapedIm.data();

  reshapedIm.dispose();

  const bObject = {
    _rtype: "ndarray",
    _rvalue: new Uint8Array(imData.buffer),
    _rshape: reshapedIm.shape,
    _rdtype: reshapedIm.dtype,
  };

  const res = await triton.execute({
    inputs: [bObject, { diameter: 30 }],
    model_name: "cellpose-python",
    decode_json: true,
    _rkwargs: true,
  });

  /*
   * The problem here is that _rvalue is returned as a Uint8Array
   * of length H*W*2 bytes, however it needs to be a Uint16Array
   * (as specified by res.info) of length H*W
   * Moreover, the underlying buffer is actually
   * H*W*2 + some number of reserved bytes at the beginning and end
   */
  let labelMask: Uint8Array | Uint16Array | Float32Array = res.mask
    ._rvalue as Uint8Array;
  /*
   * It's already of type Uint8Array, but
   * recasting drops the reserved bytes so that now the
   * underlying array buffer really is just H*W*2 bytes
   */
  labelMask = new Uint8Array(labelMask);
  /*
   * This gives the correct type view over the buffer
   * uin16 values of length H*W (little endian)
   */
  labelMask = new Uint16Array(labelMask.buffer);
  /*
   * Although the label mask returned from bio-engine
   * really are uint16 values, and we certainly don't expect any
   * label values above 2**16-1 = 65,535, tensorflow.js doesn't
   * support uint16 (as of writing). So, we cast to Float32, which
   * keeps the values preserved, but converts them to 4 byte floats.
   * It should be noted Float32 usually holds normalized values between
   * 0 and 1, but in this case they are all whole numbers 0-65535.
   * Now, H*W === length === byteLength / 4
   */
  labelMask = new Float32Array(labelMask);

  const maskTensor = tensor1d(labelMask);

  const annotations = await labelMaskToAnnotation(
    maskTensor,
    imTensor.shape[1],
    imTensor.shape[2],
    fgKindId,
    unknownCategoryId,
  );

  return annotations;
};
