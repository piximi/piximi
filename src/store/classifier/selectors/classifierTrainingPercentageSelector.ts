import { Classifier } from "types";

export const classifierTrainingPercentageSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): number => {
  return classifier.trainingPercentage;
};
