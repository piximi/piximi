import { Tensor } from "@tensorflow/tfjs";
import { Dataset } from "@tensorflow/tfjs-data";
import { Classifier } from "types";

export const classifierValidationDataSelector = ({
  classifier,
}: {
  classifier: Classifier;
}):
  | Dataset<{
      xs: Tensor;
      ys: Tensor;
      labels: Tensor;
    }>
  | undefined => {
  return classifier.valDataSet;
};
