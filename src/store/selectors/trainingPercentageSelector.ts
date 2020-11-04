import { Classifier } from "../../types/Classifier";

export const trainingPercentageSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): number => {
  return classifier.trainingPercentage;
};
