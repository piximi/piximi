import * as tensorflow from "@tensorflow/tfjs";
import { LayersModel } from "@tensorflow/tfjs";

export const predict = async (opened: LayersModel, xs: tensorflow.Tensor) => {
  const y = opened.predict(xs);

  return y;
};
