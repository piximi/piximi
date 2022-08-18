import { Classifier, ClassifierModelProps } from "types";

export const classifierSelectedModelSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): ClassifierModelProps => {
  return classifier.selectedModel;
};
