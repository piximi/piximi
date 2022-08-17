import { Classifier, Shape } from "types";

export const inputShapeSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): Shape => {
  return classifier.inputShape;
};
