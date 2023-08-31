import { Classifier, PreprocessOptions } from "types";

export const selectClassifierPreprocessOptions = ({
  classifier,
}: {
  classifier: Classifier;
}): PreprocessOptions => {
  return classifier.preprocessOptions;
};
