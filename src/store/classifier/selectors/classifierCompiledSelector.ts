import { LayersModel } from "@tensorflow/tfjs";
import { Classifier } from "types";

export const classifierCompiledSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): LayersModel | undefined => {
  return classifier.compiled;
};
