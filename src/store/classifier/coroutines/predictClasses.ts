import { Tensor, Tensor2D, Tensor4D, tidy, argMax } from "@tensorflow/tfjs";
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
): Promise<{ imageIds: Array<string>; categoryIds: Array<string> }> => {
  const inferredBatchTensors = await data
    .map((items) => {
      const batchPred = tidy(() => {
        const batchProbs = model.predict(items.xs);
        return argMax(batchProbs as Tensor, 1);
      });

      return {
        preds: batchPred,
        // TODO: image_data
        //@ts-ignore
        ids: items.ids as Tensor<Rank.R1>,
      };
    })
    .toArray();

  const inferredTensors = inferredBatchTensors.reduce((prev, curr) => {
    return {
      preds: prev.preds.concat(curr.preds),
      ids: prev.ids.concat(curr.ids),
    };
  });

  const imageIds = (await inferredTensors.ids.array()) as unknown as string[];
  const predictions = await inferredTensors.preds.array();
  // TODO: image_data
  //@ts-ignore
  const categoryIds = predictions.map((idx) => categories[idx].id);

  inferredTensors.preds.dispose();

  return { imageIds, categoryIds };
};
