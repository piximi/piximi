import * as tensorflow from "@tensorflow/tfjs";
import { Classifier } from "types";

export const classifierTrainDataSelector = ({
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
  return classifier.trainDataSet;
};
