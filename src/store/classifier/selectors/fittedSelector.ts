import { LayersModel } from "@tensorflow/tfjs";

import { Classifier } from "types";

export const fittedSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): LayersModel | undefined => {
  return classifier.fitted;
};
