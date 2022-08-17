import { Classifier, ClassifierModelProps } from "types";

export const selectedModelSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): ClassifierModelProps => {
  return classifier.selectedModel;
};
