import { Classifier } from "../../types/Classifier";
import { RescaleOptions } from "../../types/RescaleOptions";

export const rescaleOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): RescaleOptions => {
  return classifier.rescaleOptions;
};
