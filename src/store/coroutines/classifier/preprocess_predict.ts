import {
  Tensor,
  Tensor3D,
  data as tfdata,
  util as tfutil,
  browser as tfbrowser,
  image as tfimage,
} from "@tensorflow/tfjs";
import * as ImageJS from "image-js";
import { ImageType } from "../../../types/ImageType";
import { Shape } from "../../../types/Shape";
import { RescaleOptions } from "../../../types/RescaleOptions";

export const decodeImage = async (
  channels: number,
  rescale: boolean,
  item: {
    xs: string; //dataURL
    id: string;
  }
): Promise<{ xs: Tensor; id: string }> => {
  const fetched = await tfutil.fetch(item.xs);

  const buffer: ArrayBuffer = await fetched.arrayBuffer();

  let data: ImageJS.Image = await ImageJS.Image.load(buffer);

  const canvas: HTMLCanvasElement = data.getCanvas();

  let xs: Tensor3D = tfbrowser.fromPixels(canvas, channels);

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
    xs: Tensor;
    id: string;
  }
): Promise<{ xs: Tensor; id: string }> => {
  const resized = tfimage.resizeBilinear(item.xs as Tensor3D, [
    inputShape.height,
    inputShape.width,
  ]);

  return new Promise((resolve) => {
    return resolve({ ...item, xs: resized });
  });
};

export const sampleGenerator = (images: Array<ImageType>) => {
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
  images: Array<ImageType>,
  rescaleOptions: RescaleOptions,
  inputShape: Shape
): Promise<
  tfdata.Dataset<{
    xs: Tensor;
    id: string;
  }>
> => {
  const data = tfdata
    .generator(sampleGenerator(images))
    .mapAsync(
      decodeImage.bind(null, inputShape.channels, rescaleOptions.rescale)
    )
    .mapAsync(resize.bind(null, inputShape));

  return data;
};
