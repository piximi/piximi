import { ClassifierState } from "store/types";
import { ModelStatus } from "utils/models/enums";

export const selectClassifierModelStatus = ({
  classifier,
}: {
  classifier: ClassifierState;
}): ModelStatus => {
  return classifier.modelStatus;
};
