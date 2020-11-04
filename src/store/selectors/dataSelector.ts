import { Classifier } from "../../types/Classifier";
import { Dataset } from "@tensorflow/tfjs-data";
import { Tensor } from "@tensorflow/tfjs";

export const dataSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): Dataset<{ xs: Tensor; ys: Tensor }> => {
  return classifier.data!;
};
