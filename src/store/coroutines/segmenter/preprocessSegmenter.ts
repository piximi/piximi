import * as tensorflow from "@tensorflow/tfjs";
import * as ImageJS from "image-js";
import { Category } from "../../../types/Category";
import { ImageType } from "../../../types/ImageType";
import { Shape } from "../../../types/Shape";
import { FitOptions } from "types/FitOptions";
import { PreprocessOptions } from "types/PreprocessOptions";
import { RescaleOptions } from "types/RescaleOptions";
import { Partition } from "types/Partition";
import { AnnotationType } from "types/AnnotationType";

export const drawSegmentationMask = async (
  categories: Array<Category>,
  item: {
    xs: tensorflow.Tensor<tensorflow.Rank.R3>;
    annotations: AnnotationType[];
    id: string;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  ys: tensorflow.Tensor<tensorflow.Rank.R3>;
  id: string;
}> => {
  // TODO: draw the segmentation mask
  // const ys = // segmentation mask

  return new Promise((resolve) => {
    return resolve({ xs: item.xs, ys: item.xs, id: item.id });
  });
};

export const decodeFromImgSrc = async (
  channels: number,
  rescaleOptions: RescaleOptions,
  item: {
    srcs: string; // dataURL
    annotations: AnnotationType[];
    id: string;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  annotations: AnnotationType[];
  id: string;
}> => {
  const fetched = await tensorflow.util.fetch(item.srcs);

  const buffer: ArrayBuffer = await fetched.arrayBuffer();

  let data: ImageJS.Image = await ImageJS.Image.load(buffer, {
    ignorePalette: true,
  });

  const canvas: HTMLCanvasElement = data.getCanvas();

  let x: tensorflow.Tensor3D = tensorflow.browser.fromPixels(canvas, channels);

  if (rescaleOptions.rescale) {
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
  rescaleOptions: RescaleOptions,
  item: {
    srcs: Array<string>; // [#channels]: dataURL (from activePlane)
    annotations: AnnotationType[];
    id: string;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  annotations: AnnotationType[];
  id: string;
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

        if (rescaleOptions.rescale) {
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

export const decodeImage_ = (
  channels: number,
  rescaleOptions: RescaleOptions
) => {
  return (item: {
    srcs: string | string[];
    annotations: AnnotationType[];
    id: string;
  }): Promise<{
    xs: tensorflow.Tensor<tensorflow.Rank.R3>;
    annotations: AnnotationType[];
    id: string;
  }> => {
    return channels === 1 || channels === 3
      ? decodeFromImgSrc(
          channels,
          rescaleOptions,
          item as {
            srcs: string;
            annotations: AnnotationType[];
            id: string;
          }
        )
      : decodeFromOriginalSrc(
          rescaleOptions,
          item as {
            srcs: string[];
            annotations: AnnotationType[];
            id: string;
          }
        );
  };
};

export const decodeImage = async (
  channels: number,
  rescaleOptions: RescaleOptions,
  item: {
    srcs: string | string[];
    annotations: AnnotationType[];
    id: string;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  annotations: AnnotationType[];
  id: string;
}> => {
  return channels === 1 || channels === 3
    ? decodeFromImgSrc(
        channels,
        rescaleOptions,
        item as {
          srcs: string;
          annotations: AnnotationType[];
          id: string;
        }
      )
    : decodeFromOriginalSrc(
        rescaleOptions,
        item as {
          srcs: string[];
          annotations: AnnotationType[];
          id: string;
        }
      );
};

export const sampleGenerator = (images: Array<ImageType>) => {
  const count = images.length;

  return function* () {
    let index = 0;

    while (index < count) {
      const image = images[index];

      const src =
        image.shape.channels === 1 || image.shape.channels === 3
          ? image.src
          : image.originalSrc[image.activePlane];

      yield {
        id: image.id,
        srcs: src,
        annotations: image.annotations,
      };

      index++;
    }
  };
};

export const resize = async (
  inputShape: Shape,
  item: {
    xs: tensorflow.Tensor<tensorflow.Rank.R3>;
    ys: tensorflow.Tensor<tensorflow.Rank.R3>;
    id: string;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  ys: tensorflow.Tensor<tensorflow.Rank.R3>;
  id: string;
}> => {
  const resizedXs = tensorflow.image.resizeBilinear(
    item.xs as tensorflow.Tensor3D,
    [inputShape.height, inputShape.width]
  );

  // const resizedYs = tensorflow.image.resizeBilinear(
  //   item.ys as tensorflow.Tensor3D,
  //   [inputShape.height, inputShape.width]
  // );

  return new Promise((resolve) => {
    return resolve({ ...item, xs: resizedXs });
  });
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
      const channel = tensorflow.tensor3d(c, undefined, "int32");
      const imageDataArr = await tensorflow.browser.toPixels(channel);
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

  doShowImages(partition, xsData, ysData);
  return new Promise((resolve) => resolve(items));
};

const doShowFromBrowser = async (
  partition: Partition,
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
    return items.xs.mul(tensorflow.scalar(255)).arraySync() as number[][][][];
    // return items.xs.arraySync() as number[][][][];
  });
  const ysData = tensorflow.tidy(() => items.ys.arraySync());
  doShowImages(partition, xsData, ysData);
  return new Promise((resolve) => resolve(items));
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const doShow = async (
  numChannels: number,
  partition: Partition,
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
    ? doShowFromBrowser(partition, items)
    : doShowFromChannels(numChannels, partition, items);
};
/* /Debug Stuff */

export const preprocessSegmentationImages = async (
  images: Array<ImageType>,
  categories: Array<Category>,
  inputShape: Shape,
  preprocessOptions: PreprocessOptions,
  fitOptions: FitOptions
): Promise<
  tensorflow.data.Dataset<{
    xs: tensorflow.Tensor<tensorflow.Rank.R4>;
    ys: tensorflow.Tensor<tensorflow.Rank.R4>;
    id: tensorflow.Tensor<tensorflow.Rank.R1>;
  }>
> => {
  const imageData = tensorflow.data
    .generator(sampleGenerator(images))
    .mapAsync(
      decodeImage.bind(
        null,
        inputShape.channels,
        preprocessOptions.rescaleOptions
      )
    )
    .mapAsync(drawSegmentationMask.bind(null, categories))
    .mapAsync(resize.bind(null, inputShape));

  const imageDataBatched = imageData.batch(fitOptions.batchSize);
  // .mapAsync((items: any) =>
  //   doShow(inputShape.channels, images[0].partition, items)
  // ); // For debug stuff

  return imageDataBatched as tensorflow.data.Dataset<{
    xs: tensorflow.Tensor<tensorflow.Rank.R4>;
    ys: tensorflow.Tensor<tensorflow.Rank.R4>;
    id: tensorflow.Tensor<tensorflow.Rank.R1>;
  }>;
};
