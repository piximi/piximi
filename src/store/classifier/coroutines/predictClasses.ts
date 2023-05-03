// TODO - segmenter: This is now in `SimpleCNN.ts` concrete model class
import { Tensor1D, Tensor2D, Tensor4D, tidy, argMax } from "@tensorflow/tfjs";
import { Dataset } from "@tensorflow/tfjs-data";
import { LayersModel } from "@tensorflow/tfjs";
import { Category } from "types";

export const predictClasses = async (
  model: LayersModel,
  data: Dataset<{
    xs: Tensor4D;
    ys: Tensor2D;
  }>,
  categories: Array<Category>
) => {
  const inferredBatchTensors = await data
    .map((items) => {
      const batchPred = tidy(() => {
        const batchProbs = model.predict(items.xs) as Tensor2D;
        return argMax(batchProbs, 1) as Tensor1D;
      });

      return {
        preds: batchPred,
      };
    })
    .toArray();

  const inferredTensors = inferredBatchTensors.reduce((prev, curr) => {
    const res = prev.preds.concat(curr.preds);

    prev.preds.dispose();
    curr.preds.dispose();

    return {
      preds: res,
    };
  });

  const predictions = await inferredTensors.preds.array();

  const categoryIds = predictions.map((idx) => categories[idx].id);

  inferredTensors.preds.dispose();

  return categoryIds;
};
