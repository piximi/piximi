import { Image } from "../../types/Image";
import { Category } from "../../types/Category";
import { Dataset } from "@tensorflow/tfjs-data";
import * as tensorflow from "@tensorflow/tfjs";
import { Tensor } from "@tensorflow/tfjs";

export const generate = async (
  images: Array<Image>,
  categories: Array<Category>,
  options?: { validationPercentage: number }
): Promise<{
  data: Dataset<{ xs: Tensor; ys: Tensor }>;
  validationData: Dataset<{ xs: Tensor; ys: Tensor }>;
}> => {
  // const data = tensorflow.data
  //   .generator(generator(images, categories))
  //   .map(encodeCategory(categories.length))
  //   .mapAsync(encodeImage)
  //   .mapAsync(resize);
  //
  // const validationData = tensorflow.data
  //   .generator(generator(images, categories))
  //   .map(encodeCategory(categories.length))
  //   .mapAsync(encodeImage)
  //   .mapAsync(resize);

  function* foo() {
    const n = 10;
    let index = 0;
    while (index < n) {
      index++;

      yield {
        xs: tensorflow.randomNormal([10, 224, 224, 3]),
        ys: tensorflow.oneHot(tensorflow.randomUniform([10], 0, 1), 2),
      };
    }
  }

  const data = tensorflow.data.generator(foo);

  return {
    data: data,
    validationData: data,
  };
};
