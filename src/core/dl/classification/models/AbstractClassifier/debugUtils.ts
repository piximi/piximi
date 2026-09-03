import { browser, fill, scalar, slice, tensor3d, tidy } from "@tensorflow/tfjs";

import { Partition } from "core/dl/enums";

import { logger } from "utils/logUtils";

import type { Tensor1D, Tensor3D, TensorContainer } from "@tensorflow/tfjs";

let trainLimit = 0;
let valLimit = 0;
let infLimit = 0;
// xsData: [height, width, channel]; ysData: [oneHot]
const doShowImages = async (
  partition: Partition,
  xsData: number[][][],
  ysData: number[],
) => {
  try {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    const refHeight = xsData.length;
    const refWidth = xsData[0].length;

    canvas.width = refWidth;
    canvas.height = refHeight;

    const imTensor = tensor3d(xsData, undefined, "int32");
    // TF.js 4.2 types `toPixels` as `Uint8ClampedArray` (→ `<ArrayBufferLike>` under TS 5.7),
    // but `ImageData` requires the buffer to be `ArrayBuffer`. At runtime it always is.
    const imageDataArr = (await browser.toPixels(
      imTensor,
    )) as Uint8ClampedArray<ArrayBuffer>;
    imTensor.dispose();
    const imageData = new ImageData(
      imageDataArr,
      imTensor.shape[1], // width
      imTensor.shape[0], // height
    );
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.putImageData(imageData, 0, 0);

    if (partition === Partition.Training && trainLimit < 5) {
      trainLimit++;
      logger(
        `Training, class:
        ${ysData.findIndex((e) => e === 1)}
        ${canvas.toDataURL()}`,
      );
    } else if (partition === Partition.Validation && valLimit < 5) {
      valLimit++;
      logger(
        `Validation, class:
        ${ysData.findIndex((e) => e === 1)}
        ${canvas.toDataURL()}`,
      );
    } else if (partition === Partition.Inference && infLimit < 5) {
      infLimit++;
      logger(
        `Inference, class:
        ${ysData.findIndex((e) => e === 1)}
        ${canvas.toDataURL()}`,
      );
    }
  } catch (e) {
    if (import.meta.env.NODE_ENV !== "production") console.error(e);
  }
};

export const doShow = (
  partition: Partition,
  normalizedInput: boolean,
  value: TensorContainer,
) => {
  const items = value as {
    xs: Tensor3D;
    ys: Tensor1D;
  };
  const numChannels = items.xs.shape[2];

  const xsData = tidy(() => {
    let xsIm: Tensor3D;

    if (numChannels === 2) {
      const ch3 = fill(
        [items.xs.shape[0], items.xs.shape[1], items.xs.shape[2], 1],
        0,
      );
      xsIm = items.xs.concat(ch3, 3) as Tensor3D;
    } else if (numChannels > 3) {
      xsIm = slice(
        items.xs,
        [0, 0, 0],
        [items.xs.shape[0], items.xs.shape[1], 3],
      );
    } else {
      xsIm = items.xs;
    }

    if (normalizedInput) {
      // don't dispose input tensor, tidy does that for us
      xsIm = xsIm.mul(scalar(255));
    }

    return xsIm.asType("int32").arraySync() as number[][][];
  });

  const ysData = tidy(() => items.ys.arraySync());

  doShowImages(partition, xsData, ysData);
};
