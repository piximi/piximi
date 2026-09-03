import {
  oneHot,
  image as tfimage,
  data as tfdata,
  scalar,
  tensor1d,
  tensor2d,
  tidy,
} from "@tensorflow/tfjs";

import type { BitDepth, Category, Shape } from "store/data/types";
import { UNKNOWN_IMAGE_CATEGORY_ID } from "store/data/constants";
import { channelsToTensor } from "core/dl/tensor-assembly";

import type { RequireOnly } from "utils/types";
import { makeSeededRandom } from "utils/numberUtils";

import { CropSchema, Partition } from "../../../enums";
import { matchedCropPad, padToMatch } from "../../../utils";
import { doShow } from "./debugUtils";

import type { InferenceInput, TrainingInput } from "core/dl/types";
import type { Tensor1D, Tensor2D, Tensor3D, Tensor4D } from "@tensorflow/tfjs";

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

/**
 * Maps each item to the positional index of its category within `categories`,
 * producing the integer labels later consumed by `oneHot`.
 *
 * Throws if an item carries the sentinel "unknown" category id, since unknown
 * items must be filtered out before reaching the training/inference pipeline.
 */
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

/**
 * Builds a lazy `tf.data` dataset that streams one sample per item by index,
 * decoding pixel data on demand via `channelsToTensor`.
 *
 * When `inference` is true, each yielded element contains only `xs`. Otherwise
 * each element also carries a one-hot `ys` label sized to `categories.length`.
 * The `inference` discriminator is reflected in the return type so callers get
 * the correct `FitData` vs `InferenceData` shape without a cast.
 */
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

/**
 * Crops and resizes a single sample tensor to the model's expected input shape.
 *
 * Two crop schemas are supported:
 *  - `Match`: pads the sample up to `cropSize` when needed, then takes a crop
 *    sized exactly to the model input. During training with `numCrops > 1`
 *    the crop position is randomized to act as data augmentation; during
 *    inference (or with a single crop) the crop is deterministic.
 *  - `None`: passes the full image through `cropAndResize`, which rescales it
 *    to the model input shape via bilinear interpolation.
 *
 * The crop runs inside `tidy` to release intermediate tensors. The original
 * `item.xs` is preserved (the caller still owns it).
 */
const cropResize = <B extends boolean>(
  inputShape: Omit<Shape, "planes">,
  cropSchema: CropSchema,
  numCrops: number,
  inference: B,
  randomFunc:
    | ((lower: number, upper: number, floating?: boolean) => number)
    | undefined,
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
        randomFunc,
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

/**
 * Scales pixel values from their raw integer range into [0, 1] by dividing by
 * `2 ** bitDepth - 1` (e.g. 255 for 8-bit, 65535 for 16-bit).
 *
 * `channelsToTensor` returns a Float32 tensor whose values still sit in the
 * source bit-depth range, so this is the step that brings them into the
 * normalized range models expect. Disposes the original `xs` to keep GPU/CPU
 * memory bounded as the dataset streams.
 */
const normalize = <T extends { xs: Tensor3D }>(
  bitDepth: BitDepth,
  items: T,
) => {
  const maxRange = 2 ** bitDepth - 1;
  const normalizedXs = tidy(() => items.xs.div(scalar(maxRange))) as Tensor3D;
  items.xs.dispose();
  return { ...items, xs: normalizedXs };
};

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
  seed?: number;
};

/**
 * Assembles the full preprocessing pipeline that feeds the classifier: builds a
 * lazy per-sample dataset, applies crop/resize, optionally shuffles, optionally
 * normalizes, and batches.
 *
 * Behavior details worth noting:
 *  - For training with `numCrops > 1`, items are duplicated `numCrops` times so
 *    each repetition yields a different random crop (see `cropResize`). The
 *    duplicates are references — no tensor copies are made here.
 *  - The shuffle buffer is only applied when crops are stacked, since crops of
 *    the same source image would otherwise arrive consecutively and bias the
 *    gradient updates. TODO upstream warns users against cropping without
 *    shuffling for the same reason.
 *  - Normalization reads `bitDepth` from `items[0]`, so it is skipped on an
 *    empty `items` array to avoid an out-of-bounds read.
 *  - When `VITE_APP_LOG_LEVEL === "4"`, samples are rendered for debugging via
 *    `doShow`; the partition label is "Inference" in inference mode and is
 *    pulled from the first item's `partition` otherwise.
 *
 * The return type narrows on `inference`: inference mode yields batches of
 * `xs` only; training mode yields batches of `xs` plus one-hot `ys`.
 */
export const preprocessData = <B extends boolean>({
  items,
  categories,
  preprocessOptions,
  inference,
  seed,
}: PreprocessArgs & { inference: B }): B extends true
  ? tfdata.Dataset<BatchedInferenceData>
  : tfdata.Dataset<BatchedFitData> => {
  let itemSet: typeof items;
  const catSet = categories;

  if (preprocessOptions.numCrops > 1 && !inference) {
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
      seed ? makeSeededRandom(seed) : undefined,
    ),
  );

  // If we took crops, the crops from each sample will be sequentially arranged
  // ideally we want to shuffle the partition itself to avoid biasing the model
  // TODO: warn user against cropping without shuffling
  if (preprocessOptions.numCrops > 1 && preprocessOptions.shuffle) {
    imageData = imageData.shuffle(preprocessOptions.batchSize, String(seed));
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
