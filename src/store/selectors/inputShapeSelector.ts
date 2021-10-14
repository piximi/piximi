import { Classifier } from "../../types/Classifier";
import { Shape } from "../../types/Shape";

export const inputShapeSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): Shape => {
  return classifier.inputShape;
};
