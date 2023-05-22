import { Tensor4D, data as tfdata } from "@tensorflow/tfjs";
import { FitOptions, ImageType } from "types";
import { getImageSlice } from "utils/common/image";

const inferenceGenerator = (images: Array<ImageType>) => {
  const count = images.length;

  return function* () {
    let index = 0;

    while (index < count) {
      const image = images[index];
      const dataPlane = getImageSlice(image.data, image.activePlane);

      yield dataPlane;

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
    .batch(fitOptions.batchSize) as tfdata.Dataset<Tensor4D>;
};
