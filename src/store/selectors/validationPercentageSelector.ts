import { Classifier } from "../../types/Classifier";

export const validationPercentageSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): number => {
  return classifier.validationPercentage;
};
