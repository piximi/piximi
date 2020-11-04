import { Classifier } from "../../types/Classifier";

export const generatorOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): { validationPercentage: number } => {
  return { validationPercentage: classifier.validationPercentage };
};
