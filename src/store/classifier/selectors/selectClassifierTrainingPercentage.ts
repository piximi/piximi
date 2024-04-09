import { ClassifierState } from "store/types";

export const selectClassifierTrainingPercentage = ({
  classifier,
}: {
  classifier: ClassifierState;
}): number => {
  return classifier.trainingPercentage;
};
