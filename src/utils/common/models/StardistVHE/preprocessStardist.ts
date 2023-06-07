import { Tensor3D, Tensor4D, data as tfdata, tidy } from "@tensorflow/tfjs";
import { ImageType } from "types";
import { getImageSlice } from "utils/common/image";

// TODO - segmenter COCO and others uses this same generator
// refactor to a general util
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

// TODO - segmenter: there's also a pad function in classifier preporcessor
// is it compatible with this one? can we generalize so it is?
// This Stardist model requires image dimensions to be a multiple of 16
// TODO - segmenter: if you have the patience, link to the line on github
// that shows this
const padImage = (image: {
  data: Tensor3D;
  bitDepth: ImageType["bitDepth"];
  padX: number;
  padY: number;
}) => {
  const imageTensor = tidy(() => {
    if (!(image.padX === 0 && image.padY === 0)) {
      const padded = image.data.mirrorPad(
        [
          [
            image.padY % 2 === 0 ? image.padY / 2 : Math.floor(image.padY / 2),
            image.padY % 2 === 0 ? image.padY / 2 : Math.ceil(image.padY / 2),
          ],
          [
            image.padX % 2 === 0 ? image.padX / 2 : Math.floor(image.padX / 2),
            image.padX % 2 === 0 ? image.padX / 2 : Math.ceil(image.padX / 2),
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
  batchSize: number,
  dataDims: Array<{ padX: number; padY: number }>
) => {
  return tfdata
    .generator(sampleGenerator(images, dataDims))
    .map((im) => padImage(im))
    .batch(batchSize) as tfdata.Dataset<Tensor4D>;
};
