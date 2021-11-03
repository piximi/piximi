import * as tensorflow from "@tensorflow/tfjs";
import { LayersModel } from "@tensorflow/tfjs";

export const predict = async (
  opened: LayersModel,
  data: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor;
    id: string;
  }>
) => {
  const results: { [id: string]: string } = {};

  data.forEachAsync((item: { xs: tensorflow.Tensor; id: string }) => {
    const input = item.xs;
    const y = opened.predict(input.expandDims());

    //Code for converting that to a certain category ID

    // results[item.id] = computedId
    console.info("Prediction ,", y, item.id);
  });

  return results;
};
