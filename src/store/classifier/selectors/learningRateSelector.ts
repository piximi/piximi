import { Classifier } from "types";

export const learningRateSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): number => {
  return classifier.learningRate;
};
