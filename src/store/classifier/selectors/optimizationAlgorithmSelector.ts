import { Classifier, OptimizationAlgorithm } from "types";

export const optimizationAlgorithmSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): OptimizationAlgorithm => {
  return classifier.optimizationAlgorithm;
};
