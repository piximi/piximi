import { Classifier } from "types";

export const classifierPredictedSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): boolean => {
  return classifier.predicted;
};
