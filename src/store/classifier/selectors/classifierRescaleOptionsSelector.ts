import { Classifier, RescaleOptions } from "types";

export const classifierRescaleOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): RescaleOptions => {
  return classifier.preprocessOptions.rescaleOptions;
};
