import { Classifier } from "../../types/Classifier";

export const learningRateSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): number => {
  return classifier.learningRate;
};
