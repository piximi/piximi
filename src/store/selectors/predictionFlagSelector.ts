import { Classifier } from "../../types/Classifier";

export const predictionFlagSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): boolean => {
  return classifier.predicting;
};
