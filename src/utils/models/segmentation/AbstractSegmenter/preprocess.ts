import { Tensor4D, data as tfdata } from "@tensorflow/tfjs";
import { FitOptions } from "../../types";
import { denormalizeTensor, getImageSlice } from "utils/common/tensorHelpers";
import { ImageObject } from "store/data/types";

const inferenceGenerator = (images: Array<ImageObject>) => {
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
  images: Array<ImageObject>,
  _fitOptions: FitOptions
) => {
  return (
    tfdata
      .generator(inferenceGenerator(images))
      // pre type converted tensor disposed internally by tf
      .map((im) => denormalizeTensor(im.data, im.bitDepth).asType("int32"))
      .batch(1) as tfdata.Dataset<Tensor4D>
  );
};
