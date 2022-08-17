import { Classifier } from "types";

export const trainingFlagSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): boolean => {
  return classifier.fitting;
};
