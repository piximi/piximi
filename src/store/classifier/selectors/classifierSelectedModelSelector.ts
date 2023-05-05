import { Classifier } from "types";
import { SequentialClassifier } from "utils/common/models/AbstractClassifier/AbstractClassifier";

export const classifierSelectedModelSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): SequentialClassifier => {
  return classifier.selectedModel;
};
