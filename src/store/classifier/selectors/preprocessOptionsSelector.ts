import { Classifier, PreprocessOptions } from "types";

export const preprocessOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): PreprocessOptions => {
  return classifier.preprocessOptions;
};
