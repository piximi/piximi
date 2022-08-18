import { Classifier } from "types";

export const classifierEpochsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): number => {
  return classifier.fitOptions.epochs;
};
