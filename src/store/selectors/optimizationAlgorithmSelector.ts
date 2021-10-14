import { Classifier } from "../../types/Classifier";
import { OptimizationAlgorithm } from "../../types/OptimizationAlgorithm";

export const optimizationAlgorithmSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): OptimizationAlgorithm => {
  return classifier.optimizationAlgorithm;
};
