import { Classifier } from "../../types/Classifier";

export const evaluationFlagSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): boolean => {
  return classifier.evaluating;
};
