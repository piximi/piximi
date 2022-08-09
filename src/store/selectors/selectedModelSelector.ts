import { Classifier } from "../../types/Classifier";
import { ClassifierModelProps } from "../../types/ModelType";

export const selectedModelSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): ClassifierModelProps => {
  return classifier.selectedModel;
};
