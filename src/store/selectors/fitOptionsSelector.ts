import { Classifier } from "../../types/Classifier";
import { FitOptions } from "../../types/FitOptions";

export const fitOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): FitOptions => {
  return classifier.fitOptions;
};
