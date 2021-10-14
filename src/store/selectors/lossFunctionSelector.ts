import { Classifier } from "../../types/Classifier";
import { LossFunction } from "../../types/LossFunction";

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
