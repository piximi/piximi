import * as tensorflow from "@tensorflow/tfjs";
import { LayersModel } from "@tensorflow/tfjs";
import { Category } from "../../../types/Category";

export const predictCategories = async (
  opened: LayersModel,
  data: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor;
    id: string;
  }>,
  categories: Array<Category>
): Promise<{ imageIds: Array<string>; categoryIds: Array<string> }> => {
  const imageIds: Array<string> = [];
  const categoryIds: Array<string> = [];

  await data.forEachAsync((item: { xs: tensorflow.Tensor; id: string }) => {
    const input = item.xs;
    const y = opened.predict(input.expandDims()); //gives vector of probabilities

    //convert to index
    //get corresponding categories[index] in sorted (!) categories array, get category ID
    const idx = tensorflow.argMax(y as tensorflow.Tensor, 1).dataSync()[0];

    imageIds.push(item.id);
    categoryIds.push(categories[idx].id);
  });

  return { imageIds, categoryIds };
};
