import { Classifier } from "../../types/Classifier";
import { CompileOptions } from "../../types/CompileOptions";

export const compileOptionsSelector = ({
  classifier,
}: {
  classifier: Classifier;
}): CompileOptions => {
  return {
    learningRate: classifier.learningRate,
    lossFunction: classifier.lossFunction,
    metrics: classifier.metrics,
    optimizationAlgorithm: classifier.optimizationAlgorithm,
  };
};
