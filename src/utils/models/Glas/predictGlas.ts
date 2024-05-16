import {
  Tensor1D,
  Tensor4D,
  onesLike,
  tensor1d,
  tidy,
  unique,
  whereAsync,
  GraphModel,
  Tensor3D,
  tensor3d,
} from "@tensorflow/tfjs";
import { ColorModel, Image as ImageJS, ImageKind } from "image-js";

import { encode } from "utils/annotator";
import { OrphanedAnnotationObject } from "../AbstractSegmenter/AbstractSegmenter";
import { generateUUID } from "utils/common/helpers";
import { Partition } from "../enums";

const labelToAnnotation = async (
  labelMask: Tensor1D,
  label: number,
  maskH: number,
  maskW: number,
  kindId: string,
  unknownCategoryId: string
): Promise<OrphanedAnnotationObject | undefined> => {
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
    let Y = getY(idx);
    let X = getX(idx);

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
  unknownCategoryId: string
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
        unknownCategoryId
      );
      if (annotation) {
        annotations.push(annotation);
      }
    }
  }

  labelMask.dispose();

  return annotations;
};

export const predictGlas = async (
  // [B, H, W, C]
  model: GraphModel,
  imTensor: Tensor4D,
  fgKindId: string,
  unknownCategoryId: string,
  inputImDims: {
    width: number;
    height: number;
  }
) => {
  const yHat = model.execute(imTensor) as Tensor4D;

  imTensor.dispose();

  const output = yHat.reshape([
    yHat.shape[1],
    yHat.shape[2],
    yHat.shape[3],
  ]) as Tensor3D;
  yHat.dispose();

  const outputImageTensor = tidy(() =>
    // probably should be astype("bool")
    output.sigmoid().greater(0.5).mul(255).round().asType("int32")
  ) as Tensor3D;

  output.dispose();

  const height = outputImageTensor.shape[0];
  const width = outputImageTensor.shape[1];

  const image = new ImageJS({
    height,
    width,
    data: outputImageTensor.dataSync(),
    kind: "GREY" as ImageKind,
    bitDepth: 8,
    components: 1,
    alpha: 0,
    colorModel: "GREY" as ColorModel,
  });

  outputImageTensor.dispose();
  const erodedImage = image.erode({
    kernel: [
      [0, 0, 0, 0, 1, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0],
    ],
    iterations: 1,
  });

  const dilatedImage = erodedImage.dilate({
    kernel: [
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
    ],
    iterations: 1,
  });

  const labelMaskTensor = tidy(() =>
    tensor3d(dilatedImage.data as Uint8Array, [
      dilatedImage.height,
      dilatedImage.width,
      1,
    ])
      .resizeBilinear([inputImDims.height, inputImDims.width])
      .asType("float32")
  ) as Tensor3D;

  const resizedImage = new ImageJS({
    width: inputImDims.height,
    height: inputImDims.width,
    data: labelMaskTensor.dataSync(),
    kind: "GREY" as ImageKind,
    bitDepth: 8,
    components: 1,
    alpha: 0,
    colorModel: "GREY" as ColorModel,
  });

  labelMaskTensor.dispose();

  const labelMask = labelConnectedComponents(
    resizedImage.data as Uint8Array,
    resizedImage.width,
    resizedImage.height
  );

  const maskTensor = tensor1d(labelMask);

  const annotations = await labelMaskToAnnotation(
    maskTensor,
    inputImDims.height,
    inputImDims.width,
    fgKindId,
    unknownCategoryId
  );

  return annotations;
};

const labelConnectedComponents = (
  image: Uint8Array,
  width: number,
  height: number
): Uint8Array => {
  const output = new Uint8Array(image.length);
  const stack: number[] = [];
  let currentLabel = 1;

  // Helper function to check if a pixel is within bounds and is foreground
  function isForeground(x: number, y: number): boolean {
    return (
      x >= 0 &&
      x < width &&
      y >= 0 &&
      y < height &&
      image[x * height + y] === 255
    );
  }

  // Helper function to process a connected component using stack
  function processComponent(x: number, y: number) {
    stack.push(x * height + y); // Push the starting pixel
    output[x * height + y] = currentLabel; // Label the starting pixel

    while (stack.length > 0) {
      const pixel = stack.pop()!;
      const px = Math.floor(pixel / height);
      const py = pixel % height;

      // Check neighbors
      const neighbors = [
        [px - 1, py],
        [px + 1, py],
        [px, py - 1],
        [px, py + 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (isForeground(nx, ny) && output[nx * height + ny] === 0) {
          stack.push(nx * height + ny);
          output[nx * height + ny] = currentLabel;
        }
      }
    }
  }

  // Loop through each pixel
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const index = x * height + y;
      if (image[index] === 255 && output[index] === 0) {
        processComponent(x, y); // Start processing a new component
        currentLabel++; // Move to the next label for the next component
      }
    }
  }

  return output;
};
