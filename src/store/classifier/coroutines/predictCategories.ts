import * as tensorflow from "@tensorflow/tfjs";
import { LayersModel } from "@tensorflow/tfjs";
import { Category } from "types";

export const predictCategories = async (
  model: LayersModel,
  data: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor<tensorflow.Rank.R4>;
    ys: tensorflow.Tensor<tensorflow.Rank.R2>;
    labels: tensorflow.Tensor<tensorflow.Rank.R1>;
    ids: tensorflow.Tensor<tensorflow.Rank.R1>;
  }>,
  categories: Array<Category>
): Promise<{ imageIds: Array<string>; categoryIds: Array<string> }> => {
  const inferredBatchTensors = await data
    .map((items) => {
      const batchPred = tensorflow.tidy(() => {
        const batchProbs = model.predict(items.xs);
        return tensorflow.argMax(batchProbs as tensorflow.Tensor, 1);
      });

      return {
        preds: batchPred as tensorflow.Tensor<tensorflow.Rank.R1>,
        labels: items.labels as tensorflow.Tensor<tensorflow.Rank.R1>,
        ids: items.ids as tensorflow.Tensor<tensorflow.Rank.R1>,
      };
    })
    .toArray();

  const inferredTensors = inferredBatchTensors.reduce((prev, curr) => {
    return {
      preds: prev.preds.concat(curr.preds),
      labels: prev.labels.concat(curr.labels),
      ids: prev.ids.concat(curr.ids),
    };
  });

  const imageIds = (await inferredTensors.ids.array()) as unknown as string[];
  const predictions = await inferredTensors.preds.array();
  const categoryIds = predictions.map((idx) => categories[idx].id);

  inferredTensors.preds.dispose();
  inferredTensors.labels.dispose();
  inferredTensors.ids.dispose();

  return { imageIds, categoryIds };
};
