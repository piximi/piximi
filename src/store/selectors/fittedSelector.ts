import { Classifier } from "../../types/Classifier";
import { LayersModel } from "@tensorflow/tfjs";

export const fittedSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): LayersModel => {
  return classifier.fitted!;
};
