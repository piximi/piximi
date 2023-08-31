import { Classifier, FitOptions } from "types";

export const selectClassifierFitOptions = ({
  classifier,
}: {
  classifier: Classifier;
}): FitOptions => {
  return classifier.fitOptions;
};
