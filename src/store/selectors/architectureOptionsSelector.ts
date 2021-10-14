import { Classifier } from "../../types/Classifier";
import { ArchitectureOptions } from "../../types/ArchitectureOptions";

export const architectureOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): ArchitectureOptions => {
  return {
    inputShape: classifier.inputShape,
    modelMultiplier: classifier.modelMultiplier,
    modelName: classifier.modelName,
    modelVersion: classifier.modelVersion,
  };
};
