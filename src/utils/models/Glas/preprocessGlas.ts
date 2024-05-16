import { Tensor4D, data as tfdata } from "@tensorflow/tfjs";
import { getImageSlice } from "utils/common/tensorHelpers";
import { OldImageType, ImageObject } from "store/data/types";

const sampleGenerator = (images: Array<OldImageType>) => {
  const count = images.length;

  return function* () {
    let index = 0;

    while (index < count) {
      const image = images[index];
      const dataPlane = getImageSlice(image.data, image.activePlane);

      yield { dataPlane };
      index++;
    }
  };
};

export const preprocessGlas = (
  images: Array<ImageObject>,
  batchSize: number
) => {
  return tfdata
    .generator(sampleGenerator(images))
    .map((im) => im.dataPlane.resizeBilinear([768, 768]))
    .batch(batchSize) as tfdata.Dataset<Tensor4D>;
};
