import * as tensorflow from "@tensorflow/tfjs";
import { DataType } from "@tensorflow/tfjs-core";
import * as ImageJS from "image-js";
import { Category, UNKNOWN_CATEGORY_ID } from "../../../types/Category";
import { ImageType } from "../../../types/ImageType";
import { Shape } from "../../../types/Shape";
import { FitOptions } from "types/FitOptions";
import { PreprocessOptions } from "types/PreprocessOptions";

export const decodeCategory = (numCategories: number) => {
  return (item: {
    srcs: string | string[];
    labels: number;
    cropIdxs: number;
    ids: string;
  }): {
    srcs: string | string[];
    ys: tensorflow.Tensor<tensorflow.Rank.R1>;
    labels: number;
    cropIdxs: number;
    ids: string;
  } => {
    return {
      ...item,
      ys: tensorflow.oneHot(
        item.labels,
        numCategories
      ) as tensorflow.Tensor<tensorflow.Rank.R1>,
    };
  };
};

export const decodeFromImgSrc = async (
  channels: number,
  rescale: boolean,
  item: {
    srcs: string; // dataURL
    ys: tensorflow.Tensor<tensorflow.Rank.R1>;
    labels: number;
    cropIdxs: number;
    ids: string;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  ys: tensorflow.Tensor<tensorflow.Rank.R1>;
  labels: number;
  cropIdxs: number;
  ids: string;
}> => {
  const fetched = await tensorflow.util.fetch(item.srcs);

  const buffer: ArrayBuffer = await fetched.arrayBuffer();

  let data: ImageJS.Image = await ImageJS.Image.load(buffer, {
    ignorePalette: true,
  });

  const canvas: HTMLCanvasElement = data.getCanvas();

  let x: tensorflow.Tensor3D = tensorflow.browser.fromPixels(canvas, channels);

  if (rescale) {
    const rescaleFactor = tensorflow.scalar(255); //Because xs is string, values are encoded by uint8array by default
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
  rescale: boolean,
  item: {
    srcs: Array<string>; // [#channels]: dataURL (from activePlane)
    ys: tensorflow.Tensor<tensorflow.Rank.R1>;
    labels: number;
    cropIdxs: number;
    ids: string;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  ys: tensorflow.Tensor<tensorflow.Rank.R1>;
  labels: number;
  cropIdxs: number;
  ids: string;
}> => {
  const channelPromises: Array<Promise<tensorflow.Tensor2D>> = [];

  for (const channelData of item.srcs) {
    const channelPromise = tensorflow.util
      .fetch(channelData)
      .then((fetched) => fetched.arrayBuffer())
      .then((buffer) => ImageJS.Image.load(buffer))
      .then((im) => {
        const canvas = im.getCanvas();
        let x2d: tensorflow.Tensor2D = tensorflow.tidy(() => {
          const x3d = tensorflow.browser.fromPixels(canvas, 1); // 3D: [w, h, 1 channel]
          return x3d.reshape([x3d.shape[0], x3d.shape[1]]); // 2D: [w, h]
        });

        if (rescale) {
          const rescaleFactor = tensorflow.scalar(255); //Because xs is string, values are encoded by uint8array by default
          const unscaledx = x2d;
          x2d = unscaledx.div(rescaleFactor);
          unscaledx.dispose();
          rescaleFactor.dispose();
        }

        return x2d as tensorflow.Tensor2D;
      })
      .catch((err) => {
        process.env.NODE_ENV !== "production" && console.error(err);
        return tensorflow.tensor2d([[]]);
      });

    channelPromises.push(channelPromise);
  }

  return Promise.all(channelPromises).then((channels) => {
    const x: tensorflow.Tensor<tensorflow.Rank.R3> = tensorflow.stack(
      channels,
      2 // axis to stack on, producing tensor of dims: [height, width, channels]
    ) as tensorflow.Tensor<tensorflow.Rank.R3>;

    for (const c of channels) {
      c.dispose();
    }

    return { ...item, xs: x };
  });
};

export const decodeImage = async (
  channels: number,
  rescale: boolean,
  item: {
    srcs: string | string[];
    ys: tensorflow.Tensor<tensorflow.Rank.R1>;
    labels: number;
    cropIdxs: number;
    ids: string;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  ys: tensorflow.Tensor<tensorflow.Rank.R1>;
  labels: number;
  cropIdxs: number;
  ids: string;
}> => {
  return channels === 1 || channels === 3
    ? decodeFromImgSrc(
        channels,
        rescale,
        item as {
          srcs: string;
          ys: tensorflow.Tensor<tensorflow.Rank.R1>;
          labels: number;
          cropIdxs: number;
          ids: string;
        }
      )
    : decodeFromOriginalSrc(
        rescale,
        item as {
          srcs: string[];
          ys: tensorflow.Tensor<tensorflow.Rank.R1>;
          labels: number;
          cropIdxs: number;
          ids: string;
        }
      );
};

export const cropResize = async (
  inputShape: Shape,
  item: {
    xs: tensorflow.Tensor<tensorflow.Rank.R3>;
    ys: tensorflow.Tensor<tensorflow.Rank.R1>;
    labels: number;
    cropIdxs: number;
    ids: string;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  ys: tensorflow.Tensor<tensorflow.Rank.R1>;
  labels: number;
  ids: string;
}> => {
  // [y1, x1, y2, x2]
  const cropCoords = [
    // [0.0, 0.0, 1.0, 1.0],
    // [0.0, 0.0, 1.0, 1.0],
    [0.0, 0.0, 1.0, 1.0],
    [0.0, 0.0, 0.9, 0.9],
    [0.1, 0.1, 1.0, 1.0],
    [0.05, 0.05, 0.95, 0.95],
  ];

  const cropSize: [number, number] = [inputShape.height, inputShape.width];

  const crop = tensorflow.tidy(() => {
    const box = tensorflow.tensor2d(
      [cropCoords[item.cropIdxs]],
      [1, 4],
      "float32" as DataType
    );

    const boxInd = tensorflow.tensor1d([0], "int32" as DataType);

    const batchedXs = item.xs.expandDims(
      0
    ) as tensorflow.Tensor<tensorflow.Rank.R4>;

    return tensorflow.image
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
        item.xs.shape[2], // channels
      ]) as tensorflow.Tensor<tensorflow.Rank.R3>;
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
  numCrops: number
) => {
  if (numCrops <= 0) numCrops = 1;

  const count = images.length;

  return function* () {
    let index = 0;
    let cropIndex = 0;

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
        image.shape.channels === 1 || image.shape.channels === 3
          ? image.src
          : image.originalSrc[image.activePlane];

      yield {
        srcs: src,
        labels: label,
        cropIdxs: cropIndex % numCrops,
        ids: image.id,
      };

      cropIndex++;
      if (cropIndex % numCrops === 0) {
        index++;
      }
    }
  };
};

/* Debug Stuff */
let limit = 1;
// xsData: [batchNum, height, width, channel]; ysData: [batchNum, oneHot]
const doShowImages = async (xsData: number[][][][], ysData: number[][]) => {
  let canvas;
  if (process.env.NODE_ENV === "test") {
    const { createCanvas } = require("canvas");
    canvas = createCanvas(xsData[2].length, xsData[1].length);
  } else {
    canvas = document.createElement("canvas");
    canvas.width = xsData[2].length;
    canvas.height = xsData[1].length;
  }

  for (const [i, c] of xsData.entries()) {
    try {
      const channel = tensorflow.tensor3d(c, undefined, "int32");
      const imageDataArr = await tensorflow.browser.toPixels(channel);
      channel.dispose();
      let imageData;
      if (process.env.NODE_ENV === "test") {
        const { createImageData } = require("canvas");
        imageData = createImageData(imageDataArr, xsData[2].length);
      } else {
        imageData = new ImageData(
          imageDataArr,
          xsData[2].length,
          xsData[1].length
        );
      }
      const ctx = canvas.getContext("2d");
      ctx.putImageData(imageData, 0, 0);
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.error(e);
    }
    if (limit < 10) {
      limit++;
      console.log(
        "class: ",
        ysData[i].findIndex((e: any) => e === 1),
        canvas.toDataURL()
      );
    }
  }
};

const doShowFromChannels = async (
  numChannels: number,
  items: {
    xs: tensorflow.Tensor<tensorflow.Rank.R4>;
    ys: tensorflow.Tensor<tensorflow.Rank.R2>;
    labels: tensorflow.Tensor<tensorflow.Rank.R1>;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R4>;
  ys: tensorflow.Tensor<tensorflow.Rank.R2>;
  labels: tensorflow.Tensor<tensorflow.Rank.R1>;
}> => {
  const xsData = tensorflow.tidy(() => {
    let xs3ch: tensorflow.Tensor<tensorflow.Rank.R4>;
    if (numChannels === 2) {
      const ch3 = tensorflow.fill(
        [items.xs.shape[0], items.xs.shape[1], items.xs.shape[2], 1],
        0
      );
      xs3ch = items.xs.concat(ch3, 3) as tensorflow.Tensor<tensorflow.Rank.R4>;
    } else {
      xs3ch = tensorflow.slice(
        items.xs,
        [0, 0, 0, 0],
        [items.xs.shape[0], items.xs.shape[1], items.xs.shape[2], 3]
      );
    }

    return xs3ch.mul(tensorflow.scalar(255)).arraySync() as number[][][][];
  });
  const ysData = tensorflow.tidy(() => items.ys.arraySync());

  doShowImages(xsData, ysData);
  return new Promise((resolve) => resolve(items));
};

const doShowFromBrowser = async (items: {
  xs: tensorflow.Tensor<tensorflow.Rank.R4>;
  ys: tensorflow.Tensor<tensorflow.Rank.R2>;
  labels: tensorflow.Tensor<tensorflow.Rank.R1>;
}): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R4>;
  ys: tensorflow.Tensor<tensorflow.Rank.R2>;
  labels: tensorflow.Tensor<tensorflow.Rank.R1>;
}> => {
  const xsData = tensorflow.tidy(() => {
    return items.xs.mul(tensorflow.scalar(255)).arraySync() as number[][][][];
    // return items.xs.arraySync() as number[][][][];
  });
  const ysData = tensorflow.tidy(() => items.ys.arraySync());
  doShowImages(xsData, ysData);
  return new Promise((resolve) => resolve(items));
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const doShow = async (
  numChannels: number,
  items: {
    xs: tensorflow.Tensor<tensorflow.Rank.R4>;
    ys: tensorflow.Tensor<tensorflow.Rank.R2>;
    labels: tensorflow.Tensor<tensorflow.Rank.R1>;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R4>;
  ys: tensorflow.Tensor<tensorflow.Rank.R2>;
  labels: tensorflow.Tensor<tensorflow.Rank.R1>;
}> => {
  // console.log(
  //   "perf:",
  //   items.xs.shape[0],
  //   tensorflow.memory().numTensors,
  //   tensorflow.memory().numBytes, // @ts-ignore
  //   tensorflow.memory().numBytesInGPU
  // );
  return numChannels === 1 || numChannels === 3
    ? doShowFromBrowser(items)
    : doShowFromChannels(numChannels, items);
};
/* /Debug Stuff */

export const preprocess = async (
  images: Array<ImageType>,
  categories: Array<Category>,
  inputShape: Shape,
  preprocessOptions: PreprocessOptions,
  fitOptions: FitOptions
): Promise<
  tensorflow.data.Dataset<{
    xs: tensorflow.Tensor<tensorflow.Rank.R4>;
    ys: tensorflow.Tensor<tensorflow.Rank.R2>;
    labels: tensorflow.Tensor<tensorflow.Rank.R1>;
    ids: tensorflow.Tensor<tensorflow.Rank.R1>;
  }>
> => {
  let imageData = tensorflow.data
    .generator(
      sampleGenerator(
        images,
        categories,
        preprocessOptions.cropOptions.numCrops
      )
    )
    .map(decodeCategory(categories.length))
    .mapAsync(
      decodeImage.bind(
        null,
        inputShape.channels,
        preprocessOptions.rescaleOptions.rescale
      )
    )
    .mapAsync(cropResize.bind(null, inputShape));

  if (preprocessOptions.shuffle) {
    imageData = imageData.shuffle(fitOptions.batchSize);
  }

  const imageDataBatched = imageData
    .batch(fitOptions.batchSize)
    .mapAsync((items: any) => doShow(inputShape.channels, items)); // For debug stuff

  return imageDataBatched as tensorflow.data.Dataset<{
    xs: tensorflow.Tensor<tensorflow.Rank.R4>;
    ys: tensorflow.Tensor<tensorflow.Rank.R2>;
    labels: tensorflow.Tensor<tensorflow.Rank.R1>;
    ids: tensorflow.Tensor<tensorflow.Rank.R1>;
  }>;
};
