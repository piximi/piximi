import { Classifier } from "types";

export const selectClassifierTrainingPercentage = ({
  classifier,
}: {
  classifier: Classifier;
}): number => {
  return classifier.trainingPercentage;
};
