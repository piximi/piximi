import { Classifier } from "../../types/Classifier";

export const epochsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): number => {
  return classifier.fitOptions.epochs;
};
