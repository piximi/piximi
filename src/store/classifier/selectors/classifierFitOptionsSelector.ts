import { Classifier, FitOptions } from "types";

export const classifierFitOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): FitOptions => {
  return classifier.fitOptions;
};
