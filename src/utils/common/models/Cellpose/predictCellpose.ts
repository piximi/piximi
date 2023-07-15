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
import { hyphaWebsocketClient } from "imjoy-rpc";
import { v4 as uuid } from "uuid";

import { AnnotationType } from "types";

const labelToAnnotation = async (
  labelMask: Tensor1D,
  label: number,
  maskH: number,
  maskW: number,
  categoryId: string
): Promise<AnnotationType> => {
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
    categoryId,
    boundingBox: bbox as [number, number, number, number],
    decodedMask: annotationData,
    plane: 0,
    id: uuid(),
  };
};

const labelMaskToAnnotation = async (
  labelMask: Tensor1D,
  maskH: number,
  maskW: number,
  categoryId: string
) => {
  const { values, indices } = unique(labelMask);

  const labels = values.dataSync();

  indices.dispose();
  values.dispose();

  const annotations: Array<AnnotationType> = [];

  for (const label of labels) {
    if (label !== 0) {
      const annotation = await labelToAnnotation(
        labelMask,
        label,
        maskH,
        maskW,
        categoryId
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
  fgCategoryId: string,
  service: string,
  serverConfig: { name: string; server_url: string; passive: boolean }
) => {
  const reshapedIm = tidy(() =>
    imTensor
      .reshape([imTensor.shape[1], imTensor.shape[2], imTensor.shape[3]])
      .transpose([2, 0, 1])
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

  const api = await hyphaWebsocketClient.connectToServer(serverConfig);

  const triton = await api.getService(service);

  const res = await triton.execute({
    inputs: [bObject, { diameter: 30 }],
    model_name: "cellpose-python",
    decode_json: true,
    _rkwargs: true,
  });

  /*
   * The problem here is that _rvalue is returned as a Uint8Array
   * with H*W*2 bytes, however it needs to be a Uint16Array
   * (as specified by res.info)
   * of length H*W
   * We can't just do `new Uint16Array(res.mask._rvalue)` because
   * that creates a Uint16Array of length H*W*2
   * so instead we manualy contruct it by creating a blank
   * Uint16Array of empty values, create a dataview over the
   * Uint8Array buffer, taking into account the underlying byteOffset
   * from the reserved bytes of the buffer, march through the
   * Uint8Array 2 bytes at a time, and put them in the
   * constructored Uint16Array, taking into account that it's little
   * endian.
   */
  const uint16Data = new Uint16Array(res.mask._rvalue.length / 2);
  const dv = new DataView(
    res.mask._rvalue.buffer,
    res.mask._rvalue.byteOffset,
    res.mask._rvalue.byteLength
  );

  for (let i = 0; i < res.mask._rvalue.length; i += 2) {
    const littleEndian = true;
    uint16Data[i / 2] = dv.getUint16(i, littleEndian);
  }

  /*
   * TensorflowJS doesn't allow for Uint16Array, so instead
   * if we know that all values are bellow 255, we can just
   * clamp it and cast to Uin8Array, which it does support,
   * or if we know some values are above 255, we can try
   * Float32Array
   */

  const massagedData = Uint8Array.from(Uint8ClampedArray.from(uint16Data));
  const maskTensor = tensor1d(massagedData);

  const annotations = await labelMaskToAnnotation(
    maskTensor,
    imTensor.shape[1],
    imTensor.shape[2],
    fgCategoryId
  );

  return annotations;
};
