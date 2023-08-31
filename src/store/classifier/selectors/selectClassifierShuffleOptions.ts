import { Classifier } from "types";

export const selectClassifierShuffleOptions = ({
  classifier,
}: {
  classifier: Classifier;
}): boolean => {
  return classifier.preprocessOptions.shuffle;
};
