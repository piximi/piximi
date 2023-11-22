import { Classifier, Shape } from "types";

export const selectClassifierInputShape = ({
  classifier,
}: {
  classifier: Classifier;
}): Shape => {
  return classifier.inputShape;
};
