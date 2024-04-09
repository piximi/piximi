import { ClassifierState } from "store/types";
import { PreprocessOptions } from "utils/models/types";

export const selectClassifierPreprocessOptions = ({
  classifier,
}: {
  classifier: ClassifierState;
}): PreprocessOptions => {
  return classifier.preprocessOptions;
};
