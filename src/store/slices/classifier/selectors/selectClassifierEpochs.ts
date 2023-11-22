import { Classifier } from "types";

export const selectClassifierEpochs = ({
  classifier,
}: {
  classifier: Classifier;
}): number => {
  return classifier.fitOptions.epochs;
};
