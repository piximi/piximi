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

import { matchedCropPad, padToMatch } from "../../helpers";
import { FitOptions, PreprocessOptions } from "../../types";
import { CropSchema, Partition } from "../../enums";
import { denormalizeTensor, getImageSlice } from "utils/common/tensorHelpers";
import { BitDepth } from "utils/file-io/types";
import {
  OldCategory,
  OldImageType,
  ImageObject,
  Shape,
  Thing,
} from "store/data/types";
import { UNKNOWN_IMAGE_CATEGORY_ID } from "store/data/constants";
import { logger } from "utils/common/helpers";

const createClassificationIdxs = <
  T extends { id: string; categoryId: string; name: string },
  K extends { id: string }
>(
  images: T[],
  categories: K[]
) => {
  const categoryIdxs: number[] = [];

  for (const im of images) {
    const idx = categories.findIndex((cat: K) => {
      if (cat.id !== UNKNOWN_IMAGE_CATEGORY_ID) {
        return cat.id === im.categoryId;
      } else {
        throw Error(
          `image "${im.name}" has an unrecognized category id of "${im.categoryId}"`
        );
      }
    });

    categoryIdxs.push(idx);
  }

  return categoryIdxs;
};

const sampleGenerator = <T extends Omit<Thing, "kind">, K extends OldCategory>(
  images: Array<T>,
  categories: Array<K>
) => {
  const count = images.length;
  const categoryIdxs = createClassificationIdxs(images, categories);

  return function* () {
    let index = 0;

    while (index < count) {
      const image = images[index];
      let activePlane = 0;

      if ("activePlane" in image) {
        activePlane = image.activePlane as ImageObject["activePlane"];
      }
      const dataPlane = getImageSlice(image.data, activePlane);

      const label = categoryIdxs[index];
      const oneHotLabel = oneHot(label, categories.length) as Tensor1D;

      /*
       dataPlane and oneHotLabel will be disposed by TF after passing it to fit/evaluate/predict
 
       we don't clone the "dataPlane" tensor because "getImageSlice" is already giving
       us a new, disposable, tensor derived from "image"
      */

      yield {
        xs: dataPlane,
        ys: oneHotLabel,
      };

      index++;
    }
  };
};

const cropResize = (
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
      if (import.meta.env.NODE_ENV !== "production") {
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
        ? padToMatch(
            item.xs,
            { width: cropSize[1], height: cropSize[0] },
            "constant"
          )
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

const scale = (
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

//#region Debug stuff
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

    if (import.meta.env.NODE_ENV === "test") {
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
    if (import.meta.env.NODE_ENV === "test") {
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
      logger(
        `Training, class: 
        ${ysData.findIndex((e) => e === 1)}
        ${canvas.toDataURL()}`
      );
    } else if (partition === Partition.Validation && valLimit < 5) {
      valLimit++;
      logger(
        `Validation, class: 
        ${ysData.findIndex((e) => e === 1)}
        ${canvas.toDataURL()}`
      );
    } else if (partition === Partition.Inference && infLimit < 5) {
      infLimit++;
      logger(
        `Inference, class: 
        ${ysData.findIndex((e) => e === 1)}
        ${canvas.toDataURL()}`
      );
    }
  } catch (e) {
    if (import.meta.env.NODE_ENV !== "production") console.error(e);
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
  // logger(
  //   `perf:
  //   ${items.xs.shape[0]}
  //   ${memory().numTensors}
  //   ${memory().numBytes} // @ts-ignore
  //   ${memory().numBytesInGPU}`
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
//#endregion Debug stuff

type PreprocessArgs = {
  images: Array<Omit<OldImageType, "colors">>;
  categories: Array<OldCategory>;
  inputShape: Shape;
  preprocessOptions: PreprocessOptions;
  fitOptions: FitOptions;
};

export const preprocessClassifier = ({
  images,
  categories,
  inputShape,
  preprocessOptions,
  fitOptions,
}: PreprocessArgs): tfdata.Dataset<{
  xs: Tensor4D;
  ys: Tensor2D;
}> => {
  let imageSet: typeof images;
  let catSet: typeof categories;

  if (
    preprocessOptions.cropOptions.numCrops > 1 &&
    images[0].partition === Partition.Training
  ) {
    // no need to copy the tensors here
    imageSet = images.flatMap((im) =>
      Array(preprocessOptions.cropOptions.numCrops).fill(im)
    );
    catSet = categories.flatMap((cat) =>
      Array(preprocessOptions.cropOptions.numCrops).fill(cat)
    );
  } else {
    imageSet = images;
    catSet = categories;
  }

  let imageData = tfdata
    .generator(sampleGenerator(imageSet, catSet))
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

  if (import.meta.env.VITE_APP_LOG_LEVEL === "4") {
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
