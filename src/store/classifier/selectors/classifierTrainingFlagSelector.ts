import { Classifier } from "types";

export const classifierTrainingFlagSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): boolean => {
  return classifier.fitting;
};
