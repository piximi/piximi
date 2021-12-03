import * as tensorflow from "@tensorflow/tfjs";
import * as ImageJS from "image-js";
import { Category, UNKNOWN_CATEGORY_ID } from "../../../types/Category";
import { Image } from "../../../types/Image";
import { Shape } from "../../../types/Shape";
import { RescaleOptions } from "../../../types/RescaleOptions";

export const decodeCategory = (categories: number) => {
  return (item: {
    xs: string;
    ys: number;
  }): { xs: string; ys: tensorflow.Tensor } => {
    return { ...item, ys: tensorflow.oneHot(item.ys, categories) };
  };
};

export const decodeImage = async (
  channels: number,
  rescale: boolean,
  item: {
    xs: string; //dataURL
    ys: tensorflow.Tensor;
  }
): Promise<{ xs: tensorflow.Tensor; ys: tensorflow.Tensor }> => {
  const fetched = await tensorflow.util.fetch(item.xs);

  const buffer: ArrayBuffer = await fetched.arrayBuffer();

  let data: ImageJS.Image = await ImageJS.Image.load(buffer);

  const canvas: HTMLCanvasElement = data.getCanvas();

  let xs: tensorflow.Tensor3D = tensorflow.browser.fromPixels(canvas, channels);

  if (rescale) {
    xs = xs.div(255); //Because xs is string, values are encoded by uint8array by default
  }

  return new Promise((resolve) => {
    return resolve({ ...item, xs: xs });
  });
};

export const resize = async (
  inputShape: Shape,
  item: {
    xs: tensorflow.Tensor;
    ys: tensorflow.Tensor;
  }
): Promise<{ xs: tensorflow.Tensor; ys: tensorflow.Tensor }> => {
  const resized = tensorflow.image.resizeBilinear(
    item.xs as tensorflow.Tensor3D,
    [inputShape.height, inputShape.width]
  );

  return new Promise((resolve) => {
    return resolve({ ...item, xs: resized });
  });
};

export const generator = (
  images: Array<Image>,
  categories: Array<Category>
) => {
  const count = images.length;

  return function* () {
    let index = 0;

    while (index < count) {
      const image = images[index];

      // eslint-disable-next-line array-callback-return
      const ys = categories.findIndex((category: Category) => {
        if (category.id !== UNKNOWN_CATEGORY_ID) {
          return category.id === image.categoryId;
        }
      });

      yield {
        xs: image.src,
        ys: ys,
      };

      index++;
    }
  };
};

export const preprocess = async (
  trainImages: Array<Image>,
  valImages: Array<Image>,
  categories: Array<Category>,
  inputShape: Shape,
  rescaleOptions: RescaleOptions,
  trainingPercentage: number
): Promise<{
  val: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor;
    ys: tensorflow.Tensor;
  }>;
  train: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor;
    ys: tensorflow.Tensor;
  }>;
}> => {
  const trainData = tensorflow.data
    .generator(generator(trainImages, categories))
    .map(decodeCategory(categories.length))
    .mapAsync(
      decodeImage.bind(null, inputShape.channels, rescaleOptions.rescale)
    )
    .mapAsync(resize.bind(null, inputShape))
    .shuffle(32);

  const valData = tensorflow.data
    .generator(generator(valImages, categories))
    .map(decodeCategory(categories.length))
    .mapAsync(
      decodeImage.bind(null, inputShape.channels, rescaleOptions.rescale)
    )
    .mapAsync(resize.bind(null, inputShape))
    .shuffle(32);

  return { val: valData, train: trainData };
};
