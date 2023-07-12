import { Classifier } from "types";
import { availableClassifierModels } from "types/ModelType";

export const classifierSelectedModelSelector = ({
  classifier,
}: {
  classifier: Classifier;
}) => {
  return availableClassifierModels[classifier.selectedModelIdx];
};
