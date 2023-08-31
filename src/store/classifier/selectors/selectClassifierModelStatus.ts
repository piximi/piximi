import { Classifier } from "types";
import { ModelStatus } from "types/ModelType";

export const selectClassifierModelStatus = ({
  classifier,
}: {
  classifier: Classifier;
}): ModelStatus => {
  return classifier.modelStatus;
};
