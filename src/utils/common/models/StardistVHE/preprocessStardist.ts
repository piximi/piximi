import { Tensor3D, Tensor4D, data as tfdata, tidy } from "@tensorflow/tfjs";
import { FitOptions, ImageType } from "types";
import { denormalizeTensor, getImageSlice } from "utils/common/image";

// TODO - segmenter COCO and others uses this same generator
// refactor to a general util
const sampleGenerator = (images: Array<ImageType>) => {
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

// TODO - segmenter: there's also a pad function in classifier preporcessor
// is it compatible with this one? can we generalize so it is?
// This Stardist model requires image dimensions to be a multiple of 16
// TODO - segmenter: if you have the patience, link to the line on github
// that shows this
const padImage = (image: {
  data: Tensor3D;
  bitDepth: ImageType["bitDepth"];
}) => {
  const height = image.data.shape[0];
  const width = image.data.shape[1];

  const padX = width % 16 === 0 ? 0 : 16 - (width % 16);
  const padY = height % 16 === 0 ? 0 : 16 - (height % 16);

  const imageTensor = tidy(() => {
    if (!(padX === 0 && padY === 0)) {
      const padded = image.data.mirrorPad(
        [
          [
            padY % 2 === 0 ? padY / 2 : Math.floor(padY / 2),
            padY % 2 === 0 ? padY / 2 : Math.ceil(padY / 2),
          ],
          [
            padX % 2 === 0 ? padX / 2 : Math.floor(padX / 2),
            padX % 2 === 0 ? padX / 2 : Math.ceil(padX / 2),
          ],
          [0, 0],
        ],
        "reflect"
      );
      // TODO - segmenter: is it not disposed automatically by tidy?
      image.data.dispose();
      return padded;
    } else {
      return image.data;
    }
  });

  // TODO - segmenter: does Stardist expect float32, or should we cast it?
  return imageTensor as Tensor3D;
};

export const preprocessStardist = (
  images: Array<ImageType>,
  fitOptions: FitOptions
) => {
  return tfdata
    .generator(sampleGenerator(images))
    .map((im) => padImage(im))
    .batch(fitOptions.batchSize) as tfdata.Dataset<Tensor4D>;
};
