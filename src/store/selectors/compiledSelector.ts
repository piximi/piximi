import { Classifier } from "../../types/Classifier";
import { LayersModel } from "@tensorflow/tfjs";

export const compiledSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): LayersModel => {
  return classifier.compiled!;
};
