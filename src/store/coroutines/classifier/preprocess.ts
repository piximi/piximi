import * as tensorflow from "@tensorflow/tfjs";
import { DataType } from "@tensorflow/tfjs-core";
import * as ImageJS from "image-js";
import { Category, UNKNOWN_CATEGORY_ID } from "../../../types/Category";
import { ImageType } from "../../../types/ImageType";
import { Shape } from "../../../types/Shape";
import { RescaleOptions } from "../../../types/RescaleOptions";
import { FitOptions } from "types/FitOptions";

export const decodeCategory = (categories: number) => {
  return (item: {
    xs: string | string[];
    ys: number;
    cropIndex: number;
  }): {
    xs: string | string[];
    ys: tensorflow.Tensor<tensorflow.Rank.R1>;
    cropIndex: number;
  } => {
    return {
      ...item,
      ys: tensorflow.oneHot(
        item.ys,
        categories
      ) as tensorflow.Tensor<tensorflow.Rank.R1>,
    };
  };
};

export const decodeFromImgSrc = async (
  channels: number,
  rescale: boolean,
  item: {
    xs: string; // dataURL
    ys: tensorflow.Tensor<tensorflow.Rank.R1>;
    cropIndex: number;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  ys: tensorflow.Tensor<tensorflow.Rank.R1>;
  cropIndex: number;
}> => {
  const fetched = await tensorflow.util.fetch(item.xs);

  const buffer: ArrayBuffer = await fetched.arrayBuffer();

  let data: ImageJS.Image = await ImageJS.Image.load(buffer);

  const canvas: HTMLCanvasElement = data.getCanvas();

  let xs: tensorflow.Tensor3D = tensorflow.browser.fromPixels(canvas, channels);

  if (rescale) {
    const rescaleFactor = tensorflow.scalar(255); //Because xs is string, values are encoded by uint8array by default
    const unscaledxs = xs;
    xs = unscaledxs.div(rescaleFactor);
    unscaledxs.dispose();
    rescaleFactor.dispose();
  }

  return new Promise((resolve) => {
    return resolve({ ...item, xs: xs });
  });
};

export const decodeFromOriginalSrc = async (
  rescale: boolean,
  item: {
    xs: Array<string>; // [#channels]: dataURL (from activePlane)
    ys: tensorflow.Tensor<tensorflow.Rank.R1>;
    cropIndex: number;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  ys: tensorflow.Tensor<tensorflow.Rank.R1>;
  cropIndex: number;
}> => {
  const channelPromises: Array<Promise<tensorflow.Tensor2D>> = [];

  for (const channelData of item.xs) {
    const channelPromise = tensorflow.util
      .fetch(channelData)
      .then((fetched) => fetched.arrayBuffer())
      .then((buffer) => ImageJS.Image.load(buffer))
      .then((im) => {
        const canvas = im.getCanvas();
        let xs: tensorflow.Tensor2D = tensorflow.tidy(() => {
          const xs3d = tensorflow.browser.fromPixels(canvas, 1); // 3D: [w, h, 1 channel]
          return xs3d.reshape([xs3d.shape[0], xs3d.shape[1]]); // 2D: [w, h]
        });

        if (rescale) {
          const rescaleFactor = tensorflow.scalar(255); //Because xs is string, values are encoded by uint8array by default
          const unscaledxs = xs;
          xs = unscaledxs.div(rescaleFactor);
          unscaledxs.dispose();
          rescaleFactor.dispose();
        }

        return xs as tensorflow.Tensor2D;
      })
      .catch((err) => {
        process.env.NODE_ENV === "development" && console.error(err);
        return tensorflow.tensor2d([[]]);
      });

    channelPromises.push(channelPromise);
  }

  return Promise.all(channelPromises).then((channels) => {
    const xs: tensorflow.Tensor<tensorflow.Rank.R3> = tensorflow.stack(
      channels,
      2 // axis to stack on, producing tensor of dims: [height, width, channels]
    ) as tensorflow.Tensor<tensorflow.Rank.R3>;

    for (const c of channels) {
      c.dispose();
    }

    return { ...item, xs: xs };
  });
};

export const decodeImage = async (
  channels: number,
  rescale: boolean,
  item: {
    xs: string | string[];
    ys: tensorflow.Tensor<tensorflow.Rank.R1>;
    cropIndex: number;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  ys: tensorflow.Tensor<tensorflow.Rank.R1>;
  cropIndex: number;
}> => {
  return channels === 1 || channels === 3
    ? decodeFromImgSrc(
        channels,
        rescale,
        item as {
          xs: string;
          ys: tensorflow.Tensor<tensorflow.Rank.R1>;
          cropIndex: number;
        }
      )
    : decodeFromOriginalSrc(
        rescale,
        item as {
          xs: string[];
          ys: tensorflow.Tensor<tensorflow.Rank.R1>;
          cropIndex: number;
        }
      );
};

export const cropResize = async (
  inputShape: Shape,
  item: {
    xs: tensorflow.Tensor<tensorflow.Rank.R3>;
    ys: tensorflow.Tensor<tensorflow.Rank.R1>;
    cropIndex: number;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  ys: tensorflow.Tensor<tensorflow.Rank.R1>;
}> => {
  const cropCoords = [
    [0.0, 0.0, 1.0, 1.0],
    [0.0, 0.0, 1.0, 1.0],
    [0.0, 0.0, 1.0, 1.0],
    // [0.0, 0.0, 0.9, 0.9],
    // [0.1, 0.1, 1.0, 1.0],
  ];

  const cropSize: [number, number] = [inputShape.height, inputShape.width];

  const crop = tensorflow.tidy(() => {
    const box = tensorflow.tensor2d(
      [cropCoords[item.cropIndex]],
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

      // eslint-disable-next-line array-callback-return
      const ys = categories.findIndex((category: Category) => {
        if (category.id !== UNKNOWN_CATEGORY_ID) {
          return category.id === image.categoryId;
        }
      });

      const src =
        image.shape.channels === 1 || image.shape.channels === 3
          ? image.src
          : image.originalSrc[image.activePlane];

      yield {
        xs: src,
        ys: ys,
        cropIndex: cropIndex % numCrops,
      };

      cropIndex++;
      if (cropIndex % numCrops === 0) {
        index++;
      }
    }
  };
};

/* Debug Stuff */
let limit = 10;
const doShowImages = async (xsData: number[][][][], ysData: number[][]) => {
  let canvas = document.createElement("canvas");
  for (const [i, c] of xsData.entries()) {
    await tensorflow.browser.toPixels(c, canvas);
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
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R4>;
  ys: tensorflow.Tensor<tensorflow.Rank.R2>;
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
}): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R4>;
  ys: tensorflow.Tensor<tensorflow.Rank.R2>;
}> => {
  const xsData = tensorflow.tidy(() => {
    return items.xs.mul(tensorflow.scalar(255)).arraySync() as number[][][][];
  });
  const ysData = tensorflow.tidy(() => items.ys.arraySync());
  doShowImages(xsData, ysData);
  return new Promise((resolve) => resolve(items));
};

const doShow = async (
  numChannels: number,
  items: {
    xs: tensorflow.Tensor<tensorflow.Rank.R4>;
    ys: tensorflow.Tensor<tensorflow.Rank.R2>;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R4>;
  ys: tensorflow.Tensor<tensorflow.Rank.R2>;
}> => {
  console.log(
    "perf:",
    items.xs.shape[0],
    tensorflow.memory().numTensors,
    tensorflow.memory().numBytes, // @ts-ignore
    tensorflow.memory().numBytesInGPU
  );
  return numChannels === 1 || numChannels === 3
    ? doShowFromBrowser(items)
    : doShowFromChannels(numChannels, items);
};
/* /Debug Stuff */

export const preprocess = async (
  trainImages: Array<ImageType>,
  valImages: Array<ImageType>,
  categories: Array<Category>,
  inputShape: Shape,
  rescaleOptions: RescaleOptions,
  fitOptions: FitOptions
): Promise<{
  val: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor;
    ys: tensorflow.Tensor;
  }>;
  train: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor<tensorflow.Rank.R4>;
    ys: tensorflow.Tensor<tensorflow.Rank.R2>;
  }>;
}> => {
  const numCrops = 1;

  let trainData = tensorflow.data
    .generator(sampleGenerator(trainImages, categories, numCrops))
    .map(decodeCategory(categories.length))
    .mapAsync(
      decodeImage.bind(null, inputShape.channels, rescaleOptions.rescale)
    )
    .mapAsync(cropResize.bind(null, inputShape));

  if (fitOptions.shuffle) {
    trainData = trainData.shuffle(fitOptions.batchSize);
  }

  const trainDataBatched = trainData.batch(
    fitOptions.batchSize
  ) as tensorflow.data.Dataset<{
    xs: tensorflow.Tensor<tensorflow.Rank.R4>;
    ys: tensorflow.Tensor<tensorflow.Rank.R2>;
  }>;
  // .mapAsync((items: any) => doShow(inputShape.channels, items)); // For debug stuff

  const valData = tensorflow.data
    .generator(sampleGenerator(valImages, categories, 1))
    .map(decodeCategory(categories.length))
    .mapAsync(
      decodeImage.bind(null, inputShape.channels, rescaleOptions.rescale)
    )
    .mapAsync(cropResize.bind(null, inputShape))
    .batch(fitOptions.batchSize) as tensorflow.data.Dataset<{
    xs: tensorflow.Tensor<tensorflow.Rank.R4>;
    ys: tensorflow.Tensor<tensorflow.Rank.R2>;
  }>;
  // .mapAsync((items: any) => doShow(inputShape.channels, items)); // For debug stuff;

  return { val: valData, train: trainDataBatched };
};
