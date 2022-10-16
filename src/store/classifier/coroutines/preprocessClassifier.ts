import {
  Tensor,
  Tensor2D,
  Tensor3D,
  Rank,
  DataType,
  oneHot,
  util as tfutil,
  image as tfimage,
  data as tfdata,
  browser,
  scalar,
  tensor1d,
  tensor2d,
  tensor3d,
  fill,
  slice,
  stack,
  tidy,
} from "@tensorflow/tfjs";
import * as ImageJS from "image-js";
import _ from "lodash";

import { matchedCropPad, padToMatch } from "./cropUtil";

import {
  Category,
  ImageType,
  Partition,
  Shape,
  RescaleOptions,
  FitOptions,
  PreprocessOptions,
  UNKNOWN_CATEGORY_ID,
  CropSchema,
} from "types";

export const decodeCategory = (numCategories: number) => {
  return (item: {
    srcs: string | string[];
    labels: number;
    ids: string;
  }): {
    srcs: string | string[];
    ys: Tensor<Rank.R1>;
    labels: number;
    ids: string;
  } => {
    return {
      ...item,
      ys: oneHot(item.labels, numCategories) as Tensor<Rank.R1>,
    };
  };
};

export const decodeFromImgSrc = async (
  channels: number,
  rescaleOptions: RescaleOptions,
  item: {
    srcs: string; // dataURL
    ys: Tensor<Rank.R1>;
    labels: number;
    ids: string;
  }
): Promise<{
  xs: Tensor<Rank.R3>;
  ys: Tensor<Rank.R1>;
  labels: number;
  ids: string;
}> => {
  const fetched = await tfutil.fetch(item.srcs);

  const buffer: ArrayBuffer = await fetched.arrayBuffer();

  let data: ImageJS.Image = await ImageJS.Image.load(buffer, {
    ignorePalette: true,
  });

  const canvas: HTMLCanvasElement = data.getCanvas();

  let x: Tensor3D = browser.fromPixels(canvas, channels);

  if (rescaleOptions.rescale) {
    const rescaleFactor = scalar(255); //Because xs is string, values are encoded by uint8array by default
    const unscaledx = x;
    x = unscaledx.div(rescaleFactor);
    unscaledx.dispose();
    rescaleFactor.dispose();
  }

  return new Promise((resolve) => {
    return resolve({ ...item, xs: x });
  });
};

export const decodeFromOriginalSrc = async (
  rescaleOptions: RescaleOptions,
  item: {
    srcs: Array<string>; // [#channels]: dataURL (from activePlane)
    ys: Tensor<Rank.R1>;
    labels: number;
    ids: string;
  }
): Promise<{
  xs: Tensor<Rank.R3>;
  ys: Tensor<Rank.R1>;
  labels: number;
  ids: string;
}> => {
  const channelPromises: Array<Promise<Tensor2D>> = [];

  for (const channelData of item.srcs) {
    const channelPromise = tfutil
      .fetch(channelData)
      .then((fetched) => fetched.arrayBuffer())
      .then((buffer) => ImageJS.Image.load(buffer))
      .then((im) => {
        const canvas = im.getCanvas();
        let x2d: Tensor2D = tidy(() => {
          const x3d = browser.fromPixels(canvas, 1); // 3D: [w, h, 1 channel]
          return x3d.reshape([x3d.shape[0], x3d.shape[1]]); // 2D: [w, h]
        });

        if (rescaleOptions.rescale) {
          const rescaleFactor = scalar(255); //Because xs is string, values are encoded by uint8array by default
          const unscaledx = x2d;
          x2d = unscaledx.div(rescaleFactor);
          unscaledx.dispose();
          rescaleFactor.dispose();
        }

        return x2d as Tensor2D;
      })
      .catch((err) => {
        process.env.NODE_ENV !== "production" && console.error(err);
        return tensor2d([[]]);
      });

    channelPromises.push(channelPromise);
  }

  return Promise.all(channelPromises).then((channels) => {
    const x: Tensor<Rank.R3> = stack(
      channels,
      2 // axis to stack on, producing tensor of dims: [height, width, channels]
    ) as Tensor<Rank.R3>;

    for (const c of channels) {
      c.dispose();
    }

    return { ...item, xs: x };
  });
};

export const decodeImage = async (
  channels: number,
  rescaleOptions: RescaleOptions,
  item: {
    srcs: string | string[];
    ys: Tensor<Rank.R1>;
    labels: number;
    ids: string;
  }
): Promise<{
  xs: Tensor<Rank.R3>;
  ys: Tensor<Rank.R1>;
  labels: number;
  ids: string;
}> => {
  return channels === 1 || channels === 3
    ? decodeFromImgSrc(
        channels,
        rescaleOptions,
        item as {
          srcs: string;
          ys: Tensor<Rank.R1>;
          labels: number;
          ids: string;
        }
      )
    : decodeFromOriginalSrc(
        rescaleOptions,
        item as {
          srcs: string[];
          ys: Tensor<Rank.R1>;
          labels: number;
          ids: string;
        }
      );
};

export const cropResize = async (
  inputShape: Shape,
  preprocessOptions: PreprocessOptions,
  training: boolean,
  item: {
    xs: Tensor<Rank.R3>;
    ys: Tensor<Rank.R1>;
    labels: number;
    ids: string;
  }
): Promise<{
  xs: Tensor<Rank.R3>;
  ys: Tensor<Rank.R1>;
  labels: number;
  ids: string;
}> => {
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
    const box = tensor2d(cropCoords, [1, 4], "float32" as DataType);

    const boxInd = tensor1d([0], "int32" as DataType);

    const xs =
      preprocessOptions.cropOptions.cropSchema === CropSchema.Match
        ? padToMatch(item.xs, { width: cropSize[1], height: cropSize[0] })
        : item.xs;

    const batchedXs = xs.expandDims(0) as Tensor<Rank.R4>;

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
      ]) as Tensor<Rank.R3>;
  });

  return new Promise((resolve) => {
    return resolve({
      xs: crop,
      ys: item.ys,
      labels: item.labels,
      ids: item.ids,
    });
  });
};

export const sampleGenerator = (
  images: Array<ImageType>,
  categories: Array<Category>,
  channels: number
) => {
  const count = images.length;

  return function* () {
    let index = 0;

    while (index < count) {
      const image = images[index];

      const label = categories.findIndex((category: Category) => {
        if (category.id !== UNKNOWN_CATEGORY_ID) {
          return category.id === image.categoryId;
        } else {
          return -1;
        }
      });

      const src =
        channels === 1 || channels === 3
          ? image.src
          : // @ts-ignore: TODO: image_data
            image.originalSrc[image.activePlane];

      yield {
        srcs: src,
        labels: label,
        ids: image.id,
      };

      index++;
    }
  };
};

/* Debug Stuff */
let trainLimit = 1;
let valLimit = 1;
let infLimit = 1;
// xsData: [batchNum, height, width, channel]; ysData: [batchNum, oneHot]
const doShowImages = async (
  partition: Partition,
  xsData: number[][][][],
  ysData: number[][]
) => {
  let canvas;
  const refHeight = xsData[0].length;
  const refWidth = xsData[0][0].length;
  if (process.env.NODE_ENV === "test") {
    const { createCanvas } = require("canvas");
    canvas = createCanvas(refWidth, refHeight);
  } else {
    canvas = document.createElement("canvas");
    canvas.width = refWidth;
    canvas.height = refHeight;
  }

  for (const [i, c] of xsData.entries()) {
    try {
      const channel = tensor3d(c, undefined, "int32");
      const imageDataArr = await browser.toPixels(channel);
      channel.dispose();
      let imageData;
      if (process.env.NODE_ENV === "test") {
        const { createImageData } = require("canvas");
        imageData = createImageData(imageDataArr, channel.shape[1]);
      } else {
        imageData = new ImageData(
          imageDataArr,
          channel.shape[1], // width
          channel.shape[0] // height
        );
      }
      const ctx = canvas.getContext("2d");
      ctx.putImageData(imageData, 0, 0);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.error(e);
    }
    if (partition === Partition.Training && trainLimit < 5) {
      trainLimit++;
      console.log(
        "Training, class: ",
        ysData[i].findIndex((e: any) => e === 1),
        canvas.toDataURL()
      );
    } else if (partition === Partition.Validation && valLimit < 5) {
      valLimit++;
      console.log(
        "Validation, class: ",
        ysData[i].findIndex((e: any) => e === 1),
        canvas.toDataURL()
      );
    } else if (partition === Partition.Inference && infLimit < 5) {
      infLimit++;
      console.log(
        "Inference, class: ",
        ysData[i].findIndex((e: any) => e === 1),
        canvas.toDataURL()
      );
    }
  }
};

const doShowFromChannels = async (
  numChannels: number,
  partition: Partition,
  items: {
    xs: Tensor<Rank.R4>;
    ys: Tensor<Rank.R2>;
    labels: Tensor<Rank.R1>;
  }
): Promise<{
  xs: Tensor<Rank.R4>;
  ys: Tensor<Rank.R2>;
  labels: Tensor<Rank.R1>;
}> => {
  const xsData = tidy(() => {
    let xs3ch: Tensor<Rank.R4>;
    if (numChannels === 2) {
      const ch3 = fill(
        [items.xs.shape[0], items.xs.shape[1], items.xs.shape[2], 1],
        0
      );
      xs3ch = items.xs.concat(ch3, 3) as Tensor<Rank.R4>;
    } else {
      xs3ch = slice(
        items.xs,
        [0, 0, 0, 0],
        [items.xs.shape[0], items.xs.shape[1], items.xs.shape[2], 3]
      );
    }

    return xs3ch.mul(scalar(255)).arraySync() as number[][][][];
  });
  const ysData = tidy(() => items.ys.arraySync());

  doShowImages(partition, xsData, ysData);
  return new Promise((resolve) => resolve(items));
};

const doShowFromBrowser = async (
  partition: Partition,
  items: {
    xs: Tensor<Rank.R4>;
    ys: Tensor<Rank.R2>;
    labels: Tensor<Rank.R1>;
  }
): Promise<{
  xs: Tensor<Rank.R4>;
  ys: Tensor<Rank.R2>;
  labels: Tensor<Rank.R1>;
}> => {
  const xsData = tidy(() => {
    return items.xs.mul(scalar(255)).arraySync() as number[][][][];
    // return items.xs.arraySync() as number[][][][];
  });
  const ysData = tidy(() => items.ys.arraySync());
  doShowImages(partition, xsData, ysData);
  return new Promise((resolve) => resolve(items));
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const doShow = async (
  numChannels: number,
  partition: Partition,
  items: {
    xs: Tensor<Rank.R4>;
    ys: Tensor<Rank.R2>;
    labels: Tensor<Rank.R1>;
  }
): Promise<{
  xs: Tensor<Rank.R4>;
  ys: Tensor<Rank.R2>;
  labels: Tensor<Rank.R1>;
}> => {
  // console.log(
  //   "perf:",
  //   items.xs.shape[0],
  //   memory().numTensors,
  //   memory().numBytes, // @ts-ignore
  //   memory().numBytesInGPU
  // );
  return numChannels === 1 || numChannels === 3
    ? doShowFromBrowser(partition, items)
    : doShowFromChannels(numChannels, partition, items);
};
/* /Debug Stuff */

export const preprocessClassifier = async (
  images: Array<ImageType>,
  categories: Array<Category>,
  inputShape: Shape,
  preprocessOptions: PreprocessOptions,
  fitOptions: FitOptions
): Promise<
  tfdata.Dataset<{
    xs: Tensor<Rank.R4>;
    ys: Tensor<Rank.R2>;
    labels: Tensor<Rank.R1>;
    ids: Tensor<Rank.R1>;
  }>
> => {
  let multipliedImages: Array<ImageType>;
  if (
    preprocessOptions.cropOptions.numCrops > 1 &&
    images[0].partition === Partition.Training &&
    preprocessOptions.shuffle
  ) {
    multipliedImages = _.shuffle(
      images.flatMap((i) =>
        Array(preprocessOptions.cropOptions.numCrops).fill(i)
      )
    );
  } else {
    multipliedImages = images;
  }

  let imageData = tfdata
    .generator(
      sampleGenerator(multipliedImages, categories, inputShape.channels)
    )
    .map(decodeCategory(categories.length))
    .mapAsync(
      decodeImage.bind(
        null,
        inputShape.channels,
        preprocessOptions.rescaleOptions
      )
    )
    .mapAsync(
      cropResize.bind(
        null,
        inputShape,
        preprocessOptions,
        images[0].partition === Partition.Training
      )
    );

  const imageDataBatched = imageData.batch(fitOptions.batchSize);
  // .mapAsync((items: any) =>
  //   doShow(inputShape.channels, images[0].partition, items)
  // ); // For debug stuff

  return imageDataBatched as tfdata.Dataset<{
    xs: Tensor<Rank.R4>;
    ys: Tensor<Rank.R2>;
    labels: Tensor<Rank.R1>;
    ids: Tensor<Rank.R1>;
  }>;
};
