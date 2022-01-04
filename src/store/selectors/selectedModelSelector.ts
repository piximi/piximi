import { Classifier } from "../../types/Classifier";
import { ClassifierModelProps } from "../../types/ClassifierModelType";

export const selectedModelSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): ClassifierModelProps => {
  return classifier.selectedModel;
};
