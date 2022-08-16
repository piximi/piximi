import { Classifier } from "types";
import * as tensorflow from "@tensorflow/tfjs";

export const valDataSelector = ({
  classifier,
}: {
  classifier: Classifier;
}):
  | tensorflow.data.Dataset<{
      xs: tensorflow.Tensor;
      ys: tensorflow.Tensor;
      labels: tensorflow.Tensor;
    }>
  | undefined => {
  return classifier.valDataSet;
};
