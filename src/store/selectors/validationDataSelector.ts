import { Classifier } from "../../types/Classifier";
import * as tensorflow from "@tensorflow/tfjs";

export const validationDataSelector = ({
  classifier,
}: {
  classifier: Classifier;
}):
  | tensorflow.data.Dataset<{
      xs: tensorflow.Tensor;
      ys: tensorflow.Tensor;
    }>
  | Array<tensorflow.Tensor2D> => {
  return classifier.validationData!;
};
