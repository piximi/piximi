import {
  Tensor1D,
  Tensor2D,
  Tensor3D,
  Tensor4D,
  oneHot,
  image as tfimage,
  data as tfdata,
  browser,
  scalar,
  tensor1d,
  tensor2d,
  tensor3d,
  fill,
  slice,
  tidy,
  TensorContainer,
} from "@tensorflow/tfjs";

import { matchedCropPad, padToMatch } from "../../utils";
import { CropSchema, Partition } from "../../enums";
import { channelsToTensor } from "utils/dl/tensor-assembly";
import { Category, Shape } from "store/data/types";
import { BitDepth } from "store/dataV2/types";
import { UNKNOWN_IMAGE_CATEGORY_ID } from "store/data/constants";
import { logger } from "utils/logUtils";
import { RequireOnly } from "utils/types";
import { InferenceInput, TrainingInput } from "utils/dl/types";

type FitData = {
  xs: Tensor3D;
  ys: Tensor1D;
};
type InferenceData = {
  xs: Tensor3D;
};
type BatchedFitData = {
  xs: Tensor4D;
  ys: Tensor2D;
};
type BatchedInferenceData = {
  xs: Tensor4D;
};
const createClassificationIdxs = <
  T extends { id: string; categoryId: string },
  K extends { id: string },
>(
  items: T[],
  categories: K[],
) => {
  const categoryIdxs: number[] = [];

  for (const item of items) {
    const idx = categories.findIndex((cat: K) => {
      if (cat.id !== UNKNOWN_IMAGE_CATEGORY_ID) {
        return cat.id === item.categoryId;
      } else {
        throw new Error(
          `item "${item.id}" has an unrecognized category id of "${item.categoryId}"`,
        );
      }
    });

    categoryIdxs.push(idx);
  }

  return categoryIdxs;
};

const buildSampleDataset = <
  T extends TrainingInput | InferenceInput,
  K extends { id: string },
  B extends boolean,
>(
  items: Array<T>,
  categories: Array<K>,
  inference: B,
): B extends true ? tfdata.Dataset<InferenceData> : tfdata.Dataset<FitData> => {
  const count = items.length;
  const indices = tfdata.generator(function* () {
    for (let i = 0; i < count; i++) yield i;
  });

  if (inference) {
    return indices.mapAsync(async (value) => {
      const index = value as number;
      const item = items[index];
      const xs = await channelsToTensor(
        item.channelsRef,
        item.shape,
        item.region,
      );
      return { xs };
    }) as any;
  }

  const categoryIdxs = createClassificationIdxs(
    items as unknown as Array<{ id: string; categoryId: string }>,
    categories,
  );
  return indices.mapAsync(async (value) => {
    const index = value as number;
    const item = items[index];
    const xs = await channelsToTensor(
      item.channelsRef,
      item.shape,
      item.region,
    );
    const label = categoryIdxs[index];
    const oneHotLabel = oneHot(label, categories.length) as Tensor1D;
    return { xs, ys: oneHotLabel };
  }) as any;
};

const cropResize = <B extends boolean>(
  inputShape: Omit<Shape, "planes">,
  cropSchema: CropSchema,
  numCrops: number,
  inference: B,
  item: { xs: Tensor3D; ys?: Tensor1D },
): B extends true
  ? { xs: Tensor3D }
  : {
      xs: Tensor3D;
      ys: Tensor1D;
    } => {
  const cropSize: [number, number] = [inputShape.height, inputShape.width];

  // [y1, x1, y2, x2]
  let cropCoords: [number, number, number, number];
  switch (cropSchema) {
    case CropSchema.Match:
      cropCoords = matchedCropPad({
        sampleWidth: item.xs.shape[1],
        sampleHeight: item.xs.shape[0],
        cropWidth: cropSize[1],
        cropHeight: cropSize[0],
        randomCrop: !inference && numCrops > 1,
      });
      break;
    case CropSchema.None:
      cropCoords = [0.0, 0.0, 1.0, 1.0];
      break;
  }

  const crop = tidy(() => {
    const box = tensor2d(cropCoords, [1, 4], "float32");

    const boxInd = tensor1d([0], "int32");

    const xs =
      cropSchema === CropSchema.Match
        ? padToMatch(
            item.xs,
            { width: cropSize[1], height: cropSize[0] },
            "constant",
          )
        : item.xs;

    const batchedXs = xs.expandDims(0) as Tensor4D;

    return tfimage
      .cropAndResize(
        batchedXs, // needs batchSize in first dim
        box,
        boxInd,
        cropSize,
        "bilinear",
      )
      .reshape([
        inputShape.height,
        inputShape.width,
        xs.shape[2], // channels
      ]) as Tensor3D;
  });

  return {
    ...item,
    xs: crop,
  } as any;
};

const normalize = <T extends { xs: Tensor3D }>(
  bitDepth: BitDepth,
  items: T,
) => {
  const maxRange = 2 ** bitDepth - 1;
  const normalizedXs = tidy(() => items.xs.div(scalar(maxRange))) as Tensor3D;
  items.xs.dispose();
  return { ...items, xs: normalizedXs };
};

//#region Debug stuff
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

const doShow = (
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
//#endregion Debug stuff

type PreprocessArgs = {
  items: Array<TrainingInput | InferenceInput>;
  categories: Array<RequireOnly<Category, "id">>;
  preprocessOptions: {
    cropSchema: CropSchema;
    numCrops: number;
    inputShape: Omit<Shape, "planes">;
    shuffle: boolean;
    normalize: boolean;
    batchSize: number;
  };
};

export const preprocessData = <B extends boolean>({
  items,
  categories,
  preprocessOptions,
  inference,
}: PreprocessArgs & { inference: B }): B extends true
  ? tfdata.Dataset<BatchedInferenceData>
  : tfdata.Dataset<BatchedFitData> => {
  let itemSet: typeof items;
  const catSet = categories;
  if (preprocessOptions.numCrops > 1 && !inference) {
    // no need to copy the tensors here
    itemSet = items.flatMap((im) => Array(preprocessOptions.numCrops).fill(im));
  } else {
    itemSet = items;
  }

  let imageData = buildSampleDataset(itemSet, catSet, !!inference).map(
    cropResize.bind(
      null,
      preprocessOptions.inputShape,
      preprocessOptions.cropSchema,
      preprocessOptions.numCrops,
      !!inference,
    ),
  );

  // If we took crops, the crops from each sample will be sequentially arranged
  // ideally we want to shuffle the partition itself to avoid biasing the model
  // TODO: warn user against cropping without shuffling
  if (preprocessOptions.numCrops > 1 && preprocessOptions.shuffle) {
    imageData = imageData.shuffle(preprocessOptions.batchSize);
  }

  // channelsToTensor returns raw integer Float32; normalize divides by (2^bitDepth - 1)
  // Skip entirely on empty items — there's nothing to normalize, and reading bitDepth
  // from items[0] would throw.
  if (preprocessOptions.normalize && items.length > 0) {
    const bitDepth = items[0].channelsRef[0].bitDepth;
    imageData = imageData.map(normalize.bind(null, bitDepth));
  }

  if (import.meta.env.VITE_APP_LOG_LEVEL === "4") {
    const logPartition = inference
      ? Partition.Inference
      : (items[0] as TrainingInput).partition;
    imageData.forEachAsync(
      doShow.bind(null, logPartition, preprocessOptions.normalize),
    );
  }

  return imageData.batch(preprocessOptions.batchSize) as any;
};
