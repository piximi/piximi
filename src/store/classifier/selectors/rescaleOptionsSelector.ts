import { Classifier, RescaleOptions } from "types";

export const rescaleOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): RescaleOptions => {
  return classifier.preprocessOptions.rescaleOptions;
};
