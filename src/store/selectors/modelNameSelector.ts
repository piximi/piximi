import { Classifier } from "../../types/Classifier";

export const modelNameSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): string => {
  return classifier.modelName;
};
