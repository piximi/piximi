import { Classifier } from "types";

export const trainingPercentageSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): number => {
  return classifier.trainingPercentage;
};
