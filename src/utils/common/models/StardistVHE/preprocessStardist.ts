import { Tensor3D, Tensor4D, data as tfdata, tidy } from "@tensorflow/tfjs";
import { ImageType } from "types";
import { getImageSlice } from "utils/common/image";
import { padToMatch } from "../utils/crop";
import { NewImageType } from "types/ImageType";

const sampleGenerator = (
  images: Array<ImageType>,
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
  bitDepth: ImageType["bitDepth"];
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

  // no casting, stardistVHE input should be float32
  return imageTensor as Tensor3D;
};

export const preprocessStardist = (
  images: Array<ImageType>,
  batchSize: number,
  dataDims: Array<{ padX: number; padY: number }>
) => {
  return tfdata
    .generator(sampleGenerator(images, dataDims))
    .map((im) => padImage(im))
    .batch(batchSize) as tfdata.Dataset<Tensor4D>;
};

export const preprocessStardistNew = (
  images: Array<NewImageType>,
  batchSize: number,
  dataDims: Array<{ padX: number; padY: number }>
) => {
  return tfdata
    .generator(sampleGenerator(images, dataDims))
    .map((im) => padImage(im))
    .batch(batchSize) as tfdata.Dataset<Tensor4D>;
};
