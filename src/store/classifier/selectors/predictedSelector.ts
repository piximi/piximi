import { Classifier } from "types";

export const predictedSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): boolean => {
  return classifier.predicted;
};
