import { Image } from "../../../types/Image";
import { Category } from "../../../types/Category";
import { Dataset } from "@tensorflow/tfjs-data";
import * as tensorflow from "@tensorflow/tfjs";
import { Tensor } from "@tensorflow/tfjs";
import * as ImageJS from "image-js";

export const encodeCategories = (categories: number) => {
  return (item: {
    xs: string;
    ys: number;
  }): { xs: string; ys: tensorflow.Tensor } => {
    return { ...item, ys: tensorflow.oneHot(item.ys, categories) };
  };
};

export const encodeImages = async (item: {
  xs: string;
  ys: tensorflow.Tensor;
}): Promise<{ xs: tensorflow.Tensor; ys: tensorflow.Tensor }> => {
  const fetched = await tensorflow.util.fetch(item.xs);

  const buffer: ArrayBuffer = await fetched.arrayBuffer();

  const data: ImageJS.Image = await ImageJS.Image.load(buffer);

  const canvas: HTMLCanvasElement = data.getCanvas();

  const xs: tensorflow.Tensor3D = tensorflow.browser.fromPixels(canvas);

  return new Promise((resolve) => {
    return resolve({ ...item, xs: xs });
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

      const ys = categories
        .filter((category: Category) => {
          return category.id !== "00000000--0000-0000-00000000000";
        })
        .findIndex((category: Category) => {
          return category.id === image.categoryId;
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
  images: Array<Image>,
  categories: Array<Category>,
  options?: { validationPercentage: number }
): Promise<{
  data: Dataset<{ xs: Tensor; ys: Tensor }>;
  validationData: Dataset<{ xs: Tensor; ys: Tensor }>;
}> => {
  const data = tensorflow.data
    .generator(generator(images, categories))
    .map(encodeCategories(categories.length))
    .mapAsync(encodeImages)
    .mapAsync(resize);

  const validationData = tensorflow.data
    .generator(generator(images, categories))
    .map(encodeCategories(categories.length))
    .mapAsync(encodeImages)
    .mapAsync(resize);

  return {
    data: data,
    validationData: validationData,
  };
};

export const resize = async (item: {
  xs: any;
  ys: tensorflow.Tensor;
}): Promise<{ xs: tensorflow.Tensor; ys: tensorflow.Tensor }> => {
  const resized = tensorflow.image.resizeBilinear(item.xs, [224, 224]);

  return new Promise((resolve) => {
    return resolve({ ...item, xs: resized });
  });
};
