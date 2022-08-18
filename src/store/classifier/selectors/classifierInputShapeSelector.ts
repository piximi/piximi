import { Classifier, Shape } from "types";

export const classifierInputShapeSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): Shape => {
  return classifier.inputShape;
};
