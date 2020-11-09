import { Classifier } from "../../types/Classifier";
import * as tensorflow from "@tensorflow/tfjs";

export const dataSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): tensorflow.data.Dataset<{
  xs: tensorflow.Tensor;
  ys: tensorflow.Tensor;
}> => {
  return classifier.data!;
};
