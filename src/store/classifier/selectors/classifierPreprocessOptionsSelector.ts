import { Classifier, PreprocessOptions } from "types";

export const classifierPreprocessOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): PreprocessOptions => {
  return classifier.preprocessOptions;
};
