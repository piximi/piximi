import { Tensor4D, data as tfdata } from "@tensorflow/tfjs";
import { FitOptions, ImageType } from "types";
import { denormalizeTensor, getImageSlice } from "utils/common/image";

const inferenceGenerator = (images: Array<ImageType>) => {
  const count = images.length;

  return function* () {
    let index = 0;

    while (index < count) {
      const image = images[index];
      const dataPlane = getImageSlice(image.data, image.activePlane);

      yield { data: dataPlane, bitDepth: image.bitDepth };

      index++;
    }
  };
};

export const preprocessInference = (
  images: Array<ImageType>,
  fitOptions: FitOptions
) => {
  return tfdata
    .generator(inferenceGenerator(images))
    .map((im) => denormalizeTensor(im.data, im.bitDepth).asType("int32"))
    .batch(fitOptions.batchSize) as tfdata.Dataset<Tensor4D>;
};
