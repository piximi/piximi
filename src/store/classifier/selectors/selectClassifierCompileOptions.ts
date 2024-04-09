import { ClassifierState } from "store/types";
import { CompileOptions } from "utils/models/types";

export const selectClassifierCompileOptions = ({
  classifier,
}: {
  classifier: ClassifierState;
}): CompileOptions => {
  return {
    learningRate: classifier.learningRate,
    lossFunction: classifier.lossFunction,
    metrics: classifier.metrics,
    optimizationAlgorithm: classifier.optimizationAlgorithm,
  };
};
