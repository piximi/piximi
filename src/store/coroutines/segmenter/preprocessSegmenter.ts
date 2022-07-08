import * as tensorflow from "@tensorflow/tfjs";
import * as ImageJS from "image-js";
import { Category, UNKNOWN_ANNOTATION_CATEGORY_ID } from "types/Category";
import { ImageType } from "types/ImageType";
import { Shape } from "types/Shape";
import { FitOptions } from "types/FitOptions";
import { PreprocessOptions } from "types/PreprocessOptions";
import { RescaleOptions } from "types/RescaleOptions";
import { AnnotationType } from "types/AnnotationType";
import { encodeAnnotationsToSegmentationMask } from "./segmentationMasks";

export const drawSegmentationMask = async (
  createdCategoriesIDs: Array<string>,
  item: {
    xs: tensorflow.Tensor<tensorflow.Rank.R3>;
    annotations: AnnotationType[];
    id: string;
    shape: Shape;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  ys: tensorflow.Tensor<tensorflow.Rank.R3>;
  id: string;
}> => {
  const ys = tensorflow.tidy(() => {
    const segmentationMasks = encodeAnnotationsToSegmentationMask(
      item.annotations,
      item.shape,
      createdCategoriesIDs
    );

    return tensorflow.tensor3d(segmentationMasks);
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
    annotations: AnnotationType[];
    id: string;
    shape: Shape;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  annotations: AnnotationType[];
  id: string;
  shape: Shape;
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
    shape: Shape;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  annotations: AnnotationType[];
  id: string;
  shape: Shape;
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

export const decodeImage = async (
  channels: number,
  rescaleOptions: RescaleOptions,
  item: {
    srcs: string | string[];
    annotations: AnnotationType[];
    id: string;
    shape: Shape;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  annotations: AnnotationType[];
  id: string;
  shape: Shape;
}> => {
  return channels === 1 || channels === 3
    ? decodeFromImgSrc(
        channels,
        rescaleOptions,
        item as {
          srcs: string;
          annotations: AnnotationType[];
          id: string;
          shape: Shape;
        }
      )
    : decodeFromOriginalSrc(
        rescaleOptions,
        item as {
          srcs: string[];
          annotations: AnnotationType[];
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
    xs: tensorflow.Tensor<tensorflow.Rank.R3>;
    ys: tensorflow.Tensor<tensorflow.Rank.R3>;
    id: string;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  ys: tensorflow.Tensor<tensorflow.Rank.R3>;
  id: string;
}> => {
  const resizedXs = tensorflow.tidy(() => {
    return tensorflow.image.resizeBilinear(item.xs as tensorflow.Tensor3D, [
      inputShape.height,
      inputShape.width,
    ]);
  });
  item.xs.dispose();

  const resizedYs = tensorflow.tidy(() => {
    return tensorflow.image.resizeBilinear(item.ys as tensorflow.Tensor3D, [
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
  tensorflow.data.Dataset<{
    xs: tensorflow.Tensor<tensorflow.Rank.R4>;
    ys: tensorflow.Tensor<tensorflow.Rank.R4>;
    id: tensorflow.Tensor<tensorflow.Rank.R1>;
  }>
> => {
  const createdCategoriesIDs = categories
    .filter((category) => {
      return category.id === UNKNOWN_ANNOTATION_CATEGORY_ID;
    })
    .map((category) => {
      return category.id;
    });

  const imageData = tensorflow.data
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

  return imageDataBatched as tensorflow.data.Dataset<{
    xs: tensorflow.Tensor<tensorflow.Rank.R4>;
    ys: tensorflow.Tensor<tensorflow.Rank.R4>;
    id: tensorflow.Tensor<tensorflow.Rank.R1>;
  }>;
};
