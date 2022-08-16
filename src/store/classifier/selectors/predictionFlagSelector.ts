import { Classifier } from "types";

export const predictionFlagSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): boolean => {
  return classifier.predicting;
};
