import { Classifier } from "types";
import { availableClassifierModels } from "types/ModelType";

export const classifierSelectedModelIdxSelector = ({
  classifier,
}: {
  classifier: Classifier;
}) => {
  return {
    idx: classifier.selectedModelIdx,
    model: availableClassifierModels[classifier.selectedModelIdx],
  };
};
