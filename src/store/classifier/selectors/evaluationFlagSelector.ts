import { Classifier } from "types";

export const evaluationFlagSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): boolean => {
  return classifier.evaluating;
};
