import { Classifier } from "../../types/Classifier";
import * as tensorflow from "@tensorflow/tfjs";

export const trainDataSelector = ({
  classifier,
}: {
  classifier: Classifier;
}):
  | tensorflow.data.Dataset<{
      xs: tensorflow.Tensor;
      ys: tensorflow.Tensor;
    }>
  | undefined => {
  return classifier.trainDataSet;
};
