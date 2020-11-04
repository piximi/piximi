import { Classifier } from "../../types/Classifier";

export const lossHistorySelector = ({
  classifier,
}: {
  classifier: Classifier;
}): Array<{ x: number; y: number }> => {
  return classifier.lossHistory!;
};
