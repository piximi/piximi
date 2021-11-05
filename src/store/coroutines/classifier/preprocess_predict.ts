import * as tensorflow from "@tensorflow/tfjs";
import * as ImageJS from "image-js";
import { Image } from "../../../types/Image";
import { Shape } from "../../../types/Shape";
import { RescaleOptions } from "../../../types/RescaleOptions";

export const decodeImage = async (
  channels: number,
  rescale: boolean,
  item: {
    xs: string; //dataURL
    id: string;
  }
): Promise<{ xs: tensorflow.Tensor; id: string }> => {
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
    id: string;
  }
): Promise<{ xs: tensorflow.Tensor; id: string }> => {
  const resized = tensorflow.image.resizeBilinear(
    item.xs as tensorflow.Tensor3D,
    [inputShape.height, inputShape.width]
  );

  return new Promise((resolve) => {
    return resolve({ ...item, xs: resized });
  });
};

export const generator = (images: Array<Image>) => {
  const count = images.length;

  return function* () {
    let index = 0;

    while (index < count) {
      const image = images[index];

      yield {
        xs: image.src,
        id: image.id,
      };

      index++;
    }
  };
};

export const preprocess_predict = async (
  images: Array<Image>,
  rescaleOptions: RescaleOptions
): Promise<
  tensorflow.data.Dataset<{
    xs: tensorflow.Tensor;
    id: string;
  }>
> => {
  const imageShape = images[0].shape;
  const data = tensorflow.data
    .generator(generator(images))
    .mapAsync(
      decodeImage.bind(null, imageShape.channels, rescaleOptions.rescale)
    )
    .mapAsync(resize.bind(null, imageShape));

  return data;
};
