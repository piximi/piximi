import { Classifier } from "../../types/Classifier";

export const openingSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): boolean => {
  return classifier.opening;
};
