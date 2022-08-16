import { Classifier } from "types";

export const epochsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): number => {
  return classifier.fitOptions.epochs;
};
