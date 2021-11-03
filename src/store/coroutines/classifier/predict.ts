import * as tensorflow from "@tensorflow/tfjs";
import { LayersModel } from "@tensorflow/tfjs";

export const predict = async (
  opened: LayersModel,
  data: tensorflow.data.Dataset<tensorflow.Tensor>
) => {
  data.forEachAsync((input: tensorflow.Tensor) => {
    const y = opened.predict(input.expandDims());
    console.info("Prediction ,", y);
    debugger;
  });

  // const y = opened.predict(data);

  return "";
};
