import { ArchitectureOptions, Classifier } from "types";

export const architectureOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): ArchitectureOptions => {
  return {
    inputShape: classifier.inputShape,
    selectedModel: classifier.selectedModel,
  };
};
