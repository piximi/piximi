import { Tensor3D, Tensor4D, data as tfdata, tidy } from "@tensorflow/tfjs";
import { padToMatch } from "../helpers";
import { getImageSlice } from "utils/common/tensorHelpers";
import { OldImageType, ImageObject } from "store/data/types";

const sampleGenerator = (
  images: Array<OldImageType>,
  padVals: Array<{ padX: number; padY: number }>
) => {
  const count = images.length;

  return function* () {
    let index = 0;

    while (index < count) {
      const image = images[index];
      const dataPlane = getImageSlice(image.data, image.activePlane);

      yield {
        data: dataPlane,
        bitDepth: image.bitDepth,
        padX: padVals[index].padX,
        padY: padVals[index].padY,
      };

      index++;
    }
  };
};

const padImage = (image: {
  data: Tensor3D;
  bitDepth: OldImageType["bitDepth"];
  padX: number;
  padY: number;
}) => {
  const imageTensor = tidy(() => {
    if (image.padX !== 0 || image.padY !== 0) {
      const padded = padToMatch(
        image.data,
        {
          height: image.data.shape[0] + image.padY,
          width: image.data.shape[1] + image.padX,
        },
        "reflect"
      );

      // image.data disposed by padToMatch, and would be disposed by tf anyway
      return padded;
    } else {
      return image.data;
    }
  });

  // no casting, stardist input should be float32
  return imageTensor as Tensor3D;
};

export const preprocessStardist = (
  images: Array<ImageObject>,
  batchSize: number,
  dataDims: Array<{ padX: number; padY: number }>
) => {
  return tfdata
    .generator(sampleGenerator(images, dataDims))
    .map((im) => padImage(im))
    .batch(batchSize) as tfdata.Dataset<Tensor4D>;
};
