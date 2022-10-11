import { Classifier } from "types";

export const classifierShuffleOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): boolean => {
  return classifier.preprocessOptions.shuffle;
};
