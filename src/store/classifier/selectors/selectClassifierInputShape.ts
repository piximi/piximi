import { Shape } from "store/data/types";
import { ClassifierState } from "store/types";

export const selectClassifierInputShape = ({
  classifier,
}: {
  classifier: ClassifierState;
}): Shape => {
  return classifier.inputShape;
};
