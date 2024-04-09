import { ClassifierState } from "store/types";

export const selectClassifierShuffleOptions = ({
  classifier,
}: {
  classifier: ClassifierState;
}): boolean => {
  return classifier.preprocessOptions.shuffle;
};
