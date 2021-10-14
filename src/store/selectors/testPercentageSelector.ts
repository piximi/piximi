import { Classifier } from "../../types/Classifier";

export const testPercentageSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): number => {
  return classifier.testPercentage;
};
