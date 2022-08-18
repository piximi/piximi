import { Classifier } from "types";

export const classifierEvaluationFlagSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): boolean => {
  return classifier.evaluating;
};
