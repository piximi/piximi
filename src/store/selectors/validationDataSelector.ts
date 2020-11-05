import { Classifier } from "../../types/Classifier";
import { Dataset } from "@tensorflow/tfjs-data";

export const validationDataSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): Dataset<{ xs: any; ys: any }> => {
  return classifier.validationData!;
};
