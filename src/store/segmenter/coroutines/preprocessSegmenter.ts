// @ts-nocheck
// TODO: post PR #407, fix for segmenter
import {
  Tensor1D,
  Tensor2D,
  Tensor3D,
  Tensor4D,
  tensor2d,
  tensor3d,
  util as tfutil,
  image as tfimage,
  data as tfdata,
  browser,
  scalar,
  stack,
  tidy,
} from "@tensorflow/tfjs";
import * as ImageJS from "image-js";

import { Category, UNKNOWN_ANNOTATION_CATEGORY_ID } from "types/Category";
import { ImageType } from "types/ImageType";
import { Shape } from "types/Shape";
import { FitOptions } from "types/FitOptions";
import { PreprocessOptions } from "types/PreprocessOptions";
import { RescaleOptions } from "types/RescaleOptions";
import { decodedAnnotationType } from "types/AnnotationType";
import { encodeAnnotationToSegmentationMask } from "./segmentationMasks";

export const drawSegmentationMask = async (
  createdCategoriesIDs: Array<string>,
  item: {
    xs: Tensor3D;
    annotations: decodedAnnotationType[];
    id: string;
    shape: Shape;
  }
): Promise<{
  xs: Tensor3D;
  ys: Tensor3D;
  id: string;
}> => {
  const ys = tidy(() => {
    const segmentationMasks = encodeAnnotationToSegmentationMask(
      item.annotations,
      item.shape,
      createdCategoriesIDs
    );

    return tensor3d(segmentationMasks);
  });

  return new Promise((resolve) => {
    return resolve({ xs: item.xs, ys: ys, id: item.id });
  });
};

export const decodeFromImgSrc = async (
  channels: number,
  rescaleOptions: RescaleOptions,
  item: {
    srcs: string; // dataURL
    annotations: decodedAnnotationType[];
    id: string;
    shape: Shape;
  }
): Promise<{
  xs: Tensor3D;
  annotations: decodedAnnotationType[];
  id: string;
  shape: Shape;
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
    annotations: decodedAnnotationType[];
    id: string;
    shape: Shape;
  }
): Promise<{
  xs: Tensor3D;
  annotations: decodedAnnotationType[];
  id: string;
  shape: Shape;
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
    const x: Tensor3D = stack(
      channels,
      2 // axis to stack on, producing tensor of dims: [height, width, channels]
    ) as Tensor3D;

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
    annotations: decodedAnnotationType[];
    id: string;
    shape: Shape;
  }
): Promise<{
  xs: Tensor3D;
  annotations: decodedAnnotationType[];
  id: string;
  shape: Shape;
}> => {
  return channels === 1 || channels === 3
    ? decodeFromImgSrc(
        channels,
        rescaleOptions,
        item as {
          srcs: string;
          annotations: decodedAnnotationType[];
          id: string;
          shape: Shape;
        }
      )
    : decodeFromOriginalSrc(
        rescaleOptions,
        item as {
          srcs: string[];
          annotations: decodedAnnotationType[];
          id: string;
          shape: Shape;
        }
      );
};

export const sampleGenerator = (images: Array<ImageType>, channels: number) => {
  const count = images.length;

  return function* () {
    let index = 0;

    while (index < count) {
      const image = images[index];

      const src =
        channels === 1 || channels === 3
          ? image.src
          : image.originalSrc[image.activePlane];

      yield {
        id: image.id,
        srcs: src,
        annotations: image.annotations,
        shape: image.shape,
      };

      index++;
    }
  };
};

export const resize = async (
  inputShape: Shape,
  item: {
    xs: Tensor3D;
    ys: Tensor3D;
    id: string;
  }
): Promise<{
  xs: Tensor3D;
  ys: Tensor3D;
  id: string;
}> => {
  const resizedXs = tidy(() => {
    return tfimage.resizeBilinear(item.xs as Tensor3D, [
      inputShape.height,
      inputShape.width,
    ]);
  });
  item.xs.dispose();

  const resizedYs = tidy(() => {
    return tfimage.resizeBilinear(item.ys as Tensor3D, [
      inputShape.height,
      inputShape.width,
    ]);
  });
  item.ys.dispose();

  return new Promise((resolve) => {
    return resolve({ ...item, xs: resizedXs, ys: resizedYs });
  });
};

export const preprocessSegmentationImages = async (
  images: Array<ImageType>,
  categories: Array<Category>,
  inputShape: Shape,
  preprocessOptions: PreprocessOptions,
  fitOptions: FitOptions
): Promise<
  tfdata.Dataset<{
    xs: Tensor4D;
    ys: Tensor4D;
    id: Tensor1D;
  }>
> => {
  const createdCategoriesIDs = categories
    .filter((category) => {
      return category.id === UNKNOWN_ANNOTATION_CATEGORY_ID;
    })
    .map((category) => {
      return category.id;
    });

  const imageData = tfdata
    .generator(sampleGenerator(images, inputShape.channels))
    .mapAsync(
      decodeImage.bind(
        null,
        inputShape.channels,
        preprocessOptions.rescaleOptions
      )
    )
    .mapAsync(drawSegmentationMask.bind(null, createdCategoriesIDs))
    .mapAsync(resize.bind(null, inputShape));

  const imageDataBatched = imageData.batch(fitOptions.batchSize);

  return imageDataBatched as tfdata.Dataset<{
    xs: Tensor4D;
    ys: Tensor4D;
    id: Tensor1D;
  }>;
};
