import { Classifier } from "../../types/Classifier";

export const validationLossHistorySelector = ({
  classifier,
}: {
  classifier: Classifier;
}): Array<{ x: number; y: number }> => {
  return classifier.validationLossHistory!;
};
