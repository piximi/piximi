import { LossFunction } from "./LossFunction";
import { Metric } from "./Metric";
import { OptimizationAlgorithm } from "./OptimizationAlgorithm";
import { FitOptions } from "./FitOptions";
import { Shape } from "./Shape";
import { PreprocessOptions } from "./PreprocessOptions";
import { ClassifierEvaluationResultType } from "./EvaluationResultType";
import { ModelStatus } from "./ModelType";

export type Classifier = {
  // pre-fit state
  selectedModelIdx: number;
  inputShape: Shape;
  preprocessOptions: PreprocessOptions;
  fitOptions: FitOptions;

  learningRate: number;
  lossFunction: LossFunction;
  optimizationAlgorithm: OptimizationAlgorithm;
  metrics: Array<Metric>;

  trainingPercentage: number;
  // post-evaluation results
  evaluationResult: ClassifierEvaluationResultType;
  // status flags
  modelStatus: ModelStatus;
};
