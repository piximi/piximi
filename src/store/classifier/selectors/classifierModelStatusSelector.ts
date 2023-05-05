import { Classifier } from "types";
import { ModelStatus } from "types/ModelType";

export const classifierModelStatusSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): ModelStatus => {
  return classifier.modelStatus;
};
