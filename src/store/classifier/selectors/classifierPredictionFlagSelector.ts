import { Classifier } from "types";

export const classifierPredictionFlagSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): boolean => {
  return classifier.predicting;
};
