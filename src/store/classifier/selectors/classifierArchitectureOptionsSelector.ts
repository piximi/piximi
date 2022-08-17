import { ArchitectureOptions, Classifier } from "types";

export const classifierArchitectureOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): ArchitectureOptions => {
  return {
    inputShape: classifier.inputShape,
    selectedModel: classifier.selectedModel,
  };
};
