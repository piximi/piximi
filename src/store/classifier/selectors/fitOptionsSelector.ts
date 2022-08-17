import { Classifier, FitOptions } from "types";

export const fitOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): FitOptions => {
  return classifier.fitOptions;
};
