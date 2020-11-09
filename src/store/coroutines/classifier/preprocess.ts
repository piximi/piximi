import * as tensorflow from "@tensorflow/tfjs";
import * as ImageJS from "image-js";
import { Category } from "../../../types/Category";
import { Image } from "../../../types/Image";

export const decodeCategory = (categories: number) => {
  return (item: {
    xs: string;
    ys: number;
  }): { xs: string; ys: tensorflow.Tensor } => {
    return { ...item, ys: tensorflow.oneHot(item.ys, categories) };
  };
};

export const decodeImage = async (item: {
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

export const resize = async (item: {
  xs: tensorflow.Tensor;
  ys: tensorflow.Tensor;
}): Promise<{ xs: tensorflow.Tensor; ys: tensorflow.Tensor }> => {
  const resized = tensorflow.image.resizeBilinear(
    item.xs as tensorflow.Tensor3D,
    [224, 224]
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

      const ys = categories.findIndex((category: Category) => {
        if (category.id !== "00000000-0000-0000-0000-00000000000") {
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
  images: Array<Image>,
  categories: Array<Category>
): Promise<
  tensorflow.data.Dataset<{ xs: tensorflow.Tensor; ys: tensorflow.Tensor }>
> => {
  return tensorflow.data
    .generator(generator(images, categories))
    .map(decodeCategory(categories.length))
    .mapAsync(decodeImage)
    .mapAsync(resize);
};
