import { ClassifierState } from "store/types";

export const selectClassifier = ({
  classifier,
}: {
  classifier: ClassifierState;
}): ClassifierState => {
  return classifier;
};
