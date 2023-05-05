import { ClassifierArchitectureOptions, Classifier } from "types";

// TODO - segmenter: Change name to classifierModelSelector or something
// actually probably just get rid of this altogether
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
