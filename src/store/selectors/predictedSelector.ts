import { Classifier } from "../../types/Classifier";

export const predictedSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): boolean => {
  return classifier.predicted;
};
