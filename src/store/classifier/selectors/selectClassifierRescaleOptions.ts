import { ClassifierState } from "store/types";
import { RescaleOptions } from "utils/models/types";

export const selectClassifierRescaleOptions = ({
  classifier,
}: {
  classifier: ClassifierState;
}): RescaleOptions => {
  return classifier.preprocessOptions.rescaleOptions;
};
