import { ClassifierState } from "store/types";

export const selectClassifierEpochs = ({
  classifier,
}: {
  classifier: ClassifierState;
}): number => {
  return classifier.fitOptions.epochs;
};
