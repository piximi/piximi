import { Tensor, Rank, tidy, argMax } from "@tensorflow/tfjs";
import { Dataset } from "@tensorflow/tfjs-data";
import { LayersModel } from "@tensorflow/tfjs";
import { Category } from "types";

export const predictClasses = async (
  model: LayersModel,
  data: Dataset<{
    xs: Tensor<Rank.R4>;
    ys: Tensor<Rank.R2>;
    labels: Tensor<Rank.R1>;
    ids: Tensor<Rank.R1>;
  }>,
  categories: Array<Category>
): Promise<{ imageIds: Array<string>; categoryIds: Array<string> }> => {
  const inferredBatchTensors = await data
    .map((items) => {
      const batchPred = tidy(() => {
        const batchProbs = model.predict(items.xs);
        return argMax(batchProbs as Tensor, 1);
      });

      return {
        preds: batchPred as Tensor<Rank.R1>,
        labels: items.labels as Tensor<Rank.R1>,
        ids: items.ids as Tensor<Rank.R1>,
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
