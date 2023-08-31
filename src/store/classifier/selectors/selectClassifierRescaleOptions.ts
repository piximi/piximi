import { Classifier, RescaleOptions } from "types";

export const selectClassifierRescaleOptions = ({
  classifier,
}: {
  classifier: Classifier;
}): RescaleOptions => {
  return classifier.preprocessOptions.rescaleOptions;
};
