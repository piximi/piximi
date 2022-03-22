import * as tensorflow from "@tensorflow/tfjs";
import { DataType } from "@tensorflow/tfjs-core";
import * as ImageJS from "image-js";
import { Category, UNKNOWN_CATEGORY_ID } from "../../../types/Category";
import { ImageType } from "../../../types/ImageType";
import { Shape } from "../../../types/Shape";
import { RescaleOptions } from "../../../types/RescaleOptions";

export const decodeCategory = (categories: number) => {
  return (item: {
    xs: Array<string>;
    ys: number;
    cropIndex?: number;
  }): {
    xs: Array<string>;
    ys: tensorflow.Tensor<tensorflow.Rank.R1>;
    cropIndex?: number;
  } => {
    return {
      ...item,
      ys: tensorflow.oneHot(
        item.ys,
        categories
      ) as tensorflow.Tensor<tensorflow.Rank.R1>,
    };
  };
};

export const decodeImage = async (
  rescale: boolean,
  item: {
    xs: Array<string>; // [channels, dataURL] from activePlane
    ys: tensorflow.Tensor<tensorflow.Rank.R1>;
    cropIndex?: number;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  ys: tensorflow.Tensor<tensorflow.Rank.R1>;
  cropIndex?: number;
}> => {
  const channelPromises: Array<Promise<tensorflow.Tensor2D>> = [];

  for (const channelData of item.xs) {
    const channelPromise = tensorflow.util
      .fetch(channelData)
      .then((fetched) => fetched.arrayBuffer())
      .then((buffer) => ImageJS.Image.load(buffer))
      .then((im) => {
        const canvas = im.getCanvas();
        let xs: tensorflow.Tensor3D | tensorflow.Tensor2D =
          tensorflow.browser.fromPixels(canvas, 1);
        xs = xs.reshape([xs.shape[0], xs.shape[1]]);

        if (rescale) {
          xs = xs.div(tensorflow.scalar(255));
        }

        return xs as tensorflow.Tensor2D;
      })
      .catch((err) => {
        console.error(err);
        return tensorflow.tensor2d([[]]);
      });

    channelPromises.push(channelPromise);
  }

  return Promise.all(channelPromises).then((channels) => {
    const xs: tensorflow.Tensor<tensorflow.Rank.R3> = tensorflow.stack(
      channels,
      2 // axis to stack on, producing tensor of dims: [height, width, channels]
    ) as tensorflow.Tensor<tensorflow.Rank.R3>;
    return { ...item, xs: xs };
  });
};

export const resize = async (
  inputShape: Shape,
  item: {
    xs: tensorflow.Tensor<tensorflow.Rank.R3>;
    ys: tensorflow.Tensor<tensorflow.Rank.R1>;
    cropIndex?: number;
  }
): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  ys: tensorflow.Tensor<tensorflow.Rank.R1>;
  cropIndex?: number;
}> => {
  const resized = tensorflow.image.resizeBilinear(item.xs, [
    inputShape.height,
    inputShape.width,
  ]);

  return new Promise((resolve) => {
    return resolve({ ...item, xs: resized });
  });
};

export const cropResize = async (item: {
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  ys: tensorflow.Tensor<tensorflow.Rank.R1>;
  cropIndex?: number;
}): Promise<{
  xs: tensorflow.Tensor<tensorflow.Rank.R3>;
  ys: tensorflow.Tensor<tensorflow.Rank.R1>;
}> => {
  /** Testing **/
  // let samples = await items.xs.array();
  // samples = samples.slice(0, 1);
  // const sample = samples[0];
  // let canvas = document.createElement("canvas");
  // await tensorflow.browser.toPixels(sample, canvas);
  // console.log(canvas.toDataURL());
  /** End Testing */
  // const boxes = tensorflow.tensor2d(
  // [
  // [y1, x1, y2, x2] each standardized, i.e in range [0, 1]
  // [0.0, 0.0, 0.5, 1.0],
  // [0.5, 0.0, 1.0, 1.0],
  // [0.0, 0.0, 0.5, 1.0],
  // [0.5, 0.0, 1.0, 1.0],
  // [0.0, 0.0, 0.5, 1.0],
  // [0.5, 0.0, 1.0, 1.0],
  // [0.0, 0.0, 1.0, 1.0],
  // [0.0, 0.0, 0.9, 0.9],
  // [0.1, 0.1, 1.0, 1.0],
  // [0.0, 0.0, 1.0, 1.0],
  // [0.0, 0.0, 1.0, 1.0],
  // [0.0, 0.0, 1.0, 1.0],
  // ],
  // undefined, // infer shape from values
  // [numCrops, 4],
  // "float32" as DataType
  // );
  let cropIndex = item.cropIndex || 0;
  const cropCoords = [
    [0.0, 0.0, 1.0, 1.0],
    [0.0, 0.0, 0.9, 0.9],
    [0.1, 0.1, 1.0, 1.0],
  ];
  const box = tensorflow.tensor2d(
    [cropCoords[cropIndex]],
    [1, 4],
    "float32" as DataType
  );
  // const boxInd = tensorflow.tensor1d([0, 0, 0, 0, 0, 0], "int32" as DataType);
  // const boxInd = tensorflow.tensor1d([0, 0, 0], "int32" as DataType);
  const boxInd = tensorflow.tensor1d([0], "int32" as DataType);
  // const cropSize: [number, number] = [28, 28];
  const cropSize: [number, number] = [item.xs.shape[0], item.xs.shape[1]];
  const batchedXs = item.xs.expandDims(
    0
  ) as tensorflow.Tensor<tensorflow.Rank.R4>;
  const crop = tensorflow.image
    .cropAndResize(
      batchedXs, // needs batchSize in first dim
      box,
      boxInd,
      cropSize,
      "bilinear"
    )
    .reshape([
      item.xs.shape[0],
      item.xs.shape[1],
      item.xs.shape[2],
    ]) as tensorflow.Tensor<tensorflow.Rank.R3>;

  // let cropArr = await crop.array();

  // const x = tensorflow.tensor2d([1, 2, 3, 4], [1, 4]);

  // let canvas = document.createElement("canvas");
  // for (const c of cropsArr) {
  //   await tensorflow.browser.toPixels(c, canvas);
  //   console.log(canvas.toDataURL());
  // }

  return new Promise((resolve) => {
    return resolve({
      xs: crop,
      ys: item.ys,
      // .expandDims(0) // convert to rank 2
      // .tile([numCrops, 1]), // repeat numCrops times
    });
  });
};

export const trainingGenerator = (
  images: Array<ImageType>,
  categories: Array<Category>,
  numCrops: number
) => {
  const count = images.length;

  return function* () {
    let index = 0;
    let cropIndex = 0;

    while (index < count) {
      const image = images[index];

      // eslint-disable-next-line array-callback-return
      const ys = categories.findIndex((category: Category) => {
        if (category.id !== UNKNOWN_CATEGORY_ID) {
          return category.id === image.categoryId;
        }
      });

      yield {
        xs: image.originalSrc[image.activePlane],
        ys: ys,
        cropIndex: cropIndex % numCrops,
      };

      cropIndex++;
      if (cropIndex % numCrops === 0) {
        index++;
      }
    }
  };
};

export const validationGenerator = (
  images: Array<ImageType>,
  categories: Array<Category>
) => {
  const count = images.length;

  return function* () {
    let index = 0;

    while (index < count) {
      const image = images[index];

      // eslint-disable-next-line array-callback-return
      const ys = categories.findIndex((category: Category) => {
        if (category.id !== UNKNOWN_CATEGORY_ID) {
          return category.id === image.categoryId;
        }
      });

      yield {
        xs: image.originalSrc[image.activePlane],
        ys: ys,
      };

      index++;
    }
  };
};

/* Debug Stuff */
// let limit = 0;
// const doShow = async (
//   items: any
// ): Promise<{
//   xs: tensorflow.Tensor<tensorflow.Rank.R4>;
//   ys: tensorflow.Tensor<tensorflow.Rank.R2>;
// }> => {
//   const xsData = await items.xs.array();
//   const ysData = await items.ys.array();

//   let canvas = document.createElement("canvas");
//   for (const [i, c] of xsData.entries()) {
//     await tensorflow.browser.toPixels(c, canvas);
//     if (limit < 10) {
//       limit++;
//       console.log(
//         "class: ",
//         ysData[i].findIndex((e: any) => e === 1),
//         canvas.toDataURL()
//       );
//     }
//   }

//   return new Promise((resolve) => resolve(items));
// };
/* /Debug Stuff */

export const preprocess = async (
  trainImages: Array<ImageType>,
  valImages: Array<ImageType>,
  categories: Array<Category>,
  inputShape: Shape,
  rescaleOptions: RescaleOptions,
  batchSize: number
): Promise<{
  val: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor;
    ys: tensorflow.Tensor;
  }>;
  train: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor;
    ys: tensorflow.Tensor;
  }>;
}> => {
  const numCrops = 3;

  let trainData = tensorflow.data
    .generator(trainingGenerator(trainImages, categories, numCrops))
    .map(decodeCategory(categories.length))
    .mapAsync(decodeImage.bind(null, rescaleOptions.rescale))
    .mapAsync(resize.bind(null, inputShape))
    .mapAsync(cropResize.bind(null))
    .shuffle(batchSize)
    .batch(batchSize);
  // .mapAsync((items: any) => doShow(items));  // For debug stuff

  const valData = tensorflow.data
    .generator(validationGenerator(valImages, categories))
    .map(decodeCategory(categories.length))
    .mapAsync(decodeImage.bind(null, rescaleOptions.rescale))
    .mapAsync(resize.bind(null, inputShape));

  //@ts-ignore
  return { val: valData, train: trainData };
};
