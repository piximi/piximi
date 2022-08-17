import { Classifier, CompileOptions } from "types";

export const classifierCompileOptionsSelector = ({
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
