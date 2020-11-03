import { LossFunction } from "./LossFunction";
import { Metric } from "./Metric";
import { OptimizationAlgorithm } from "./OptimizationAlgorithm";

export type CompileOptions = {
  learningRate: number;
  lossFunction:
    | LossFunction
    | Array<LossFunction>
    | { [outputName: string]: LossFunction };
  metrics: Array<Metric>;
  optimizationAlgorithm: OptimizationAlgorithm;
};
