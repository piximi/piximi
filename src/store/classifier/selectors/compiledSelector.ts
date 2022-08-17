import { LayersModel } from "@tensorflow/tfjs";
import { Classifier } from "types";

export const compiledSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): LayersModel | undefined => {
  return classifier.compiled;
};
