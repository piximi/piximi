// @ts-nocheck: TODO - post PR #407, fix for segmenter
import {
  util as tfutil,
  image as tfimage,
  data as tfdata,
  browser,
  scalar,
  stack,
  tidy,
  Tensor1D,
  Tensor2D,
  Tensor3D,
  Tensor4D,
  tensor2d,
  tensor3d,
} from "@tensorflow/tfjs";
import IJSImage from "image-js";
import {
  Category,
  DecodedAnnotationObject,
  ImageObject,
  Shape,
} from "store/data/types";
import { FitOptions, PreprocessOptions, RescaleOptions } from "../types";
import { UNKNOWN_ANNOTATION_CATEGORY_ID } from "store/data/constants";

//import { encodeAnnotationToSegmentationMask } from "./segmentationMasks";

const drawSegmentationMask = async (
  createdCategoriesIDs: Array<string>,
  item: {
    xs: Tensor3D;
    annotations: DecodedAnnotationObject[];
    id: string;
    shape: Shape;
  },
): Promise<{
  xs: Tensor3D;
  ys: Tensor3D;
  id: string;
}> => {
  const ys = tidy(() => {
    const segmentationMasks = encodeAnnotationToSegmentationMask(
      item.annotations,
      item.shape,
      createdCategoriesIDs,
    );

    return tensor3d(segmentationMasks);
  });

  return new Promise((resolve) => {
    return resolve({ xs: item.xs, ys: ys, id: item.id });
  });
};

const decodeFromOriginalSrc = async (
  rescaleOptions: RescaleOptions,
  item: {
    srcs: Array<string>; // [#channels]: dataURL (from activePlane)
    annotations: DecodedAnnotationObject[];
    id: string;
    shape: Shape;
  },
): Promise<{
  xs: Tensor3D;
  annotations: DecodedAnnotationObject[];
  id: string;
  shape: Shape;
}> => {
  const channelPromises: Array<Promise<Tensor2D>> = [];

  for (const channelData of item.srcs) {
    const channelPromise = tfutil
      .fetch(channelData)
      .then((fetched) => fetched.arrayBuffer())
      .then((buffer) => IJSImage.load(buffer))
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
        import.meta.env.NODE_ENV !== "production" && console.error(err);
        return tensor2d([[]]);
      });

    channelPromises.push(channelPromise);
  }

  return Promise.all(channelPromises).then((channels) => {
    const x: Tensor3D = stack(
      channels,
      2, // axis to stack on, producing tensor of dims: [height, width, channels]
    ) as Tensor3D;

    for (const c of channels) {
      c.dispose();
    }

    return { ...item, xs: x };
  });
};

const decodeImage = async (
  channels: number,
  rescaleOptions: RescaleOptions,
  item: {
    srcs: string | string[];
    annotations: DecodedAnnotationObject[];
    id: string;
    shape: Shape;
  },
): Promise<{
  xs: Tensor3D;
  annotations: DecodedAnnotationObject[];
  id: string;
  shape: Shape;
}> => {
  return channels === 1 || channels === 3
    ? decodeFromImgSrc(
        channels,
        rescaleOptions,
        item as {
          srcs: string;
          annotations: DecodedAnnotationObject[];
          id: string;
          shape: Shape;
        },
      )
    : decodeFromOriginalSrc(
        rescaleOptions,
        item as {
          srcs: string[];
          annotations: DecodedAnnotationObject[];
          id: string;
          shape: Shape;
        },
      );
};

const sampleGenerator = (images: Array<ImageObject>, channels: number) => {
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

const resize = async (
  inputShape: Shape,
  item: {
    xs: Tensor3D;
    ys: Tensor3D;
    id: string;
  },
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
  images: Array<ImageObject>,
  categories: Array<Category>,
  inputShape: Shape,
  preprocessOptions: PreprocessOptions,
  fitOptions: FitOptions,
  operation?: "training" | "validation" | "inference",
): Promise<
  | tfdata.Dataset<{
      xs: Tensor4D;
      ys: Tensor4D;
      id: Tensor1D;
    }>
  | tfdata.Dataset<{
      xs: Tensor3D;
      ys: Tensor3D;
      id: string;
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
        preprocessOptions.rescaleOptions,
      ),
    )
    .mapAsync(drawSegmentationMask.bind(null, createdCategoriesIDs))
    .mapAsync(resize.bind(null, inputShape));

  if (!operation || operation !== "inference") {
    const imageDataBatched = imageData.batch(fitOptions.batchSize);

    return imageDataBatched as tfdata.Dataset<{
      xs: Tensor4D;
      ys: Tensor4D;
      id: Tensor1D;
    }>;
  } else {
    return imageData;
  }
};
