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
import _ from "lodash";

import {
  denormalizeTensor,
  getImageSlice,
  BitDepth,
} from "image/utils/imageHelper";

import { matchedCropPad, padToMatch } from "./cropUtil";

import {
  Category,
  ImageType,
  Partition,
  Shape,
  FitOptions,
  PreprocessOptions,
  UNKNOWN_CATEGORY_ID,
  CropSchema,
} from "types";

export const createClassificationLabels = (
  images: ImageType[],
  categories: Category[]
) => {
  const labels: Array<Tensor1D> = [];

  for (const image of images) {
    const labelIdx = categories.findIndex((category: Category) => {
      if (category.id !== UNKNOWN_CATEGORY_ID) {
        return category.id === image.categoryId;
      } else {
        throw Error(
          `image "${image.name}" has an unrecognized category id of "${image.categoryId}"`
        );
      }
    });

    const label = oneHot(labelIdx, categories.length) as Tensor1D;

    labels.push(label);
  }

  return labels;
};

export const sampleGenerator = (
  images: Array<ImageType>,
  labels: Array<Tensor1D>
) => {
  const count = images.length;

  return function* () {
    let index = 0;

    while (index < count) {
      const image = images[index];
      const label = labels[index];

      const dataPlane = getImageSlice(image.data, image.activePlane);

      /*
      we clone the "label" tensor below, because it will be disposed internally
      when passing it to TF for fit/evaluate/predict

      we don't clone the "image" tensor because "getImageSlice" is already giving
      us a new, disposable, tensor derived from "image"
      */

      yield {
        xs: dataPlane,
        ys: label.clone(),
      };

      index++;
    }
  };
};

export const cropResize = (
  inputShape: Shape,
  preprocessOptions: PreprocessOptions,
  training: boolean,
  item: {
    xs: Tensor3D;
    ys: Tensor1D;
  }
): {
  xs: Tensor3D;
  ys: Tensor1D;
} => {
  const cropSize: [number, number] = [inputShape.height, inputShape.width];

  // [y1, x1, y2, x2]
  let cropCoords: [number, number, number, number];
  switch (preprocessOptions.cropOptions.cropSchema) {
    case CropSchema.Match:
      cropCoords = matchedCropPad({
        sampleWidth: item.xs.shape[1],
        sampleHeight: item.xs.shape[0],
        cropWidth: cropSize[1],
        cropHeight: cropSize[0],
        randomCrop: training && preprocessOptions.cropOptions.numCrops > 1,
      });
      break;
    case CropSchema.None:
      cropCoords = [0.0, 0.0, 1.0, 1.0];
      break;
    default:
      if (process.env.NODE_ENV !== "production") {
        console.error(
          "No case for CropSchema:",
          preprocessOptions.cropOptions.cropSchema
        );
      }
      throw Error("CropSchema has unknown value");
  }

  const crop = tidy(() => {
    const box = tensor2d(cropCoords, [1, 4], "float32");

    const boxInd = tensor1d([0], "int32");

    const xs =
      preprocessOptions.cropOptions.cropSchema === CropSchema.Match
        ? padToMatch(item.xs, { width: cropSize[1], height: cropSize[0] })
        : item.xs;

    const batchedXs = xs.expandDims(0) as Tensor4D;

    return tfimage
      .cropAndResize(
        batchedXs, // needs batchSize in first dim
        box,
        boxInd,
        cropSize,
        "bilinear"
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
  };
};

export const scale = (
  bitDepth: BitDepth,
  items: {
    xs: Tensor3D;
    ys: Tensor1D;
  }
) => {
  const scaleddXs = denormalizeTensor(items.xs, bitDepth);

  return {
    ...items,
    xs: scaleddXs,
  };
};

/* Debug Stuff */
let trainLimit = 0;
let valLimit = 0;
let infLimit = 0;
// xsData: [height, width, channel]; ysData: [oneHot]
const doShowImages = async (
  partition: Partition,
  xsData: number[][][],
  ysData: number[]
) => {
  try {
    let canvas: HTMLCanvasElement;
    const refHeight = xsData.length;
    const refWidth = xsData[0].length;

    if (process.env.NODE_ENV === "test") {
      const { createCanvas } = require("canvas");
      canvas = createCanvas(refWidth, refHeight);
    } else {
      canvas = document.createElement("canvas");
      canvas.width = refWidth;
      canvas.height = refHeight;
    }

    const imTensor = tensor3d(xsData, undefined, "int32");
    const imageDataArr = await browser.toPixels(imTensor);
    imTensor.dispose();
    let imageData;
    if (process.env.NODE_ENV === "test") {
      const { createImageData } = require("canvas");
      imageData = createImageData(imageDataArr, imTensor.shape[1]);
    } else {
      imageData = new ImageData(
        imageDataArr,
        imTensor.shape[1], // width
        imTensor.shape[0] // height
      );
    }
    const ctx = canvas.getContext("2d");
    //@ts-ignore
    ctx.putImageData(imageData, 0, 0);

    if (partition === Partition.Training && trainLimit < 5) {
      trainLimit++;
      console.log(
        "Training, class: ",
        ysData.findIndex((e) => e === 1),
        canvas.toDataURL()
      );
    } else if (partition === Partition.Validation && valLimit < 5) {
      valLimit++;
      console.log(
        "Validation, class: ",
        ysData.findIndex((e) => e === 1),
        canvas.toDataURL()
      );
    } else if (partition === Partition.Inference && infLimit < 5) {
      infLimit++;
      console.log(
        "Inference, class: ",
        ysData.findIndex((e) => e === 1),
        canvas.toDataURL()
      );
    }
  } catch (e) {
    if (process.env.NODE_ENV !== "production") console.error(e);
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const doShow = (
  partition: Partition,
  scale: boolean,
  value: TensorContainer
) => {
  const items = value as {
    xs: Tensor3D;
    ys: Tensor1D;
  };
  // console.log(
  //   "perf:",
  //   items.xs.shape[0],
  //   memory().numTensors,
  //   memory().numBytes, // @ts-ignore
  //   memory().numBytesInGPU
  // );
  const numChannels = items.xs.shape[2];

  const xsData = tidy(() => {
    let xsIm: Tensor3D;

    if (numChannels === 2) {
      const ch3 = fill(
        [items.xs.shape[0], items.xs.shape[1], items.xs.shape[2], 1],
        0
      );
      xsIm = items.xs.concat(ch3, 3) as Tensor3D;
    } else if (numChannels > 3) {
      xsIm = slice(
        items.xs,
        [0, 0, 0],
        [items.xs.shape[0], items.xs.shape[1], 3]
      );
    } else {
      xsIm = items.xs;
    }

    if (scale) {
      // don't dispose input tensor, tidy does that for us
      xsIm = xsIm.mul(scalar(255));
    }

    return xsIm.asType("int32").arraySync() as number[][][];
  });

  const ysData = tidy(() => items.ys.arraySync());

  doShowImages(partition, xsData, ysData);
};
/* /Debug Stuff */

export const preprocessClassifier = (
  images: Array<ImageType>,
  labels: Array<Tensor1D>,
  inputShape: Shape,
  preprocessOptions: PreprocessOptions,
  fitOptions: FitOptions
): tfdata.Dataset<{
  xs: Tensor4D;
  ys: Tensor2D;
}> => {
  let imageSet: typeof images;
  let labelSet: typeof labels;

  if (
    preprocessOptions.cropOptions.numCrops > 1 &&
    images[0].partition === Partition.Training
  ) {
    // TODO: image_data - data tensors need to be copied?
    imageSet = images.flatMap((im) =>
      Array(preprocessOptions.cropOptions.numCrops).fill(im)
    );
    labelSet = labels.flatMap((label) =>
      Array(preprocessOptions.cropOptions.numCrops).fill(label)
    );
  } else {
    imageSet = images;
    labelSet = labels;
  }

  let imageData = tfdata
    .generator(sampleGenerator(imageSet, labelSet))
    .map(
      cropResize.bind(
        null,
        inputShape,
        preprocessOptions,
        images[0].partition === Partition.Training
      )
    );

  // If we took crops, the crops from each sample will be sequentially arranged
  // ideally we want to shuffle the partition itslef to avoid biasing the model
  // TODO: warn user against cropping without shuffling
  if (preprocessOptions.cropOptions.numCrops > 1 && preprocessOptions.shuffle) {
    imageData = imageData.shuffle(fitOptions.batchSize);
  }

  // rescaled (in range [0, 1]) by default, scale up if rescale is off
  if (!preprocessOptions.rescaleOptions.rescale) {
    imageData = imageData.map(scale.bind(null, images[0].bitDepth));
  }

  if (process.env.REACT_APP_LOG_LEVEL === "4") {
    imageData.forEachAsync(
      doShow.bind(
        null,
        images[0].partition,
        preprocessOptions.rescaleOptions.rescale
      )
    );
  }

  return imageData.batch(fitOptions.batchSize) as tfdata.Dataset<{
    xs: Tensor4D;
    ys: Tensor2D;
  }>;
};
