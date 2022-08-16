import { Classifier, LossFunction } from "types";

export const lossFunctionSelector = ({
  classifier,
}: {
  classifier: Classifier;
}):
  | LossFunction
  | Array<LossFunction>
  | { [outputName: string]: LossFunction } => {
  return classifier.lossFunction;
};
