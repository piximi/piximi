import { ClassifierArchitectureOptions, Classifier } from "types";

export const classifierArchitectureOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): ClassifierArchitectureOptions => {
  return {
    inputShape: classifier.inputShape,
    selectedModel: classifier.selectedModel,
  };
};
