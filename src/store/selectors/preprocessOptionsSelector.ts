import { Classifier } from "../../types/Classifier";
import { PreprocessOptions } from "../../types/PreprocessOptions";

export const preprocessOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): PreprocessOptions => {
  return classifier.preprocessOptions;
};
