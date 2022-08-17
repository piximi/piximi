import { Classifier, CompileOptions } from "types";

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
