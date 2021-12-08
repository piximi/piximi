import { Classifier } from "../../types/Classifier";

export const trainingFlagSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): boolean => {
  return classifier.fitting;
};
