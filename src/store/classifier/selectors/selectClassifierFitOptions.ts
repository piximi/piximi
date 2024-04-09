import { ClassifierState } from "store/types";
import { FitOptions } from "utils/models/types";

export const selectClassifierFitOptions = ({
  classifier,
}: {
  classifier: ClassifierState;
}): FitOptions => {
  return classifier.fitOptions;
};
