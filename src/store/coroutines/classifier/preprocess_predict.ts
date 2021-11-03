import * as tensorflow from "@tensorflow/tfjs";
import * as ImageJS from "image-js";
import { Image } from "../../../types/Image";
import { Shape } from "../../../types/Shape";
import { RescaleOptions } from "../../../types/RescaleOptions";

export const decodeImage = async (
  channels: number,
  rescale: boolean,
  item: string //dataURL
): Promise<tensorflow.Tensor> => {
  const fetched = await tensorflow.util.fetch(item);

  const buffer: ArrayBuffer = await fetched.arrayBuffer();

  let data: ImageJS.Image = await ImageJS.Image.load(buffer);

  const canvas: HTMLCanvasElement = data.getCanvas();

  let xs: tensorflow.Tensor3D = tensorflow.browser.fromPixels(canvas, channels);

  if (rescale) {
    xs = xs.div(255); //Because xs is string, values are encoded by uint8array by default
  }

  return new Promise((resolve) => {
    return resolve(xs);
  });
};

export const resize = async (
  inputShape: Shape,
  xs: tensorflow.Tensor
): Promise<tensorflow.Tensor> => {
  const resized = tensorflow.image.resizeBilinear(xs as tensorflow.Tensor3D, [
    inputShape.height,
    inputShape.width,
  ]);

  return new Promise((resolve) => {
    return resolve(resized);
  });
};

export const generator = (images: Array<Image>) => {
  const count = images.length;

  return function* () {
    let index = 0;

    while (index < count) {
      const image = images[index];

      yield image.src;
    }
  };
};

export const preprocess_predict = async (
  images: Array<Image>,
  inputShape: Shape,
  rescaleOptions: RescaleOptions
): Promise<tensorflow.data.Dataset<tensorflow.Tensor>> => {
  const data = tensorflow.data
    .generator(generator(images))
    .mapAsync(
      decodeImage.bind(null, inputShape.channels, rescaleOptions.rescale)
    )
    .mapAsync(resize.bind(null, inputShape));

  return data;
};
