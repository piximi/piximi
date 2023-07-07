import { History } from "@tensorflow/tfjs";
import { LossFunction } from "./LossFunction";
import { Metric } from "./Metric";
import { OptimizationAlgorithm } from "./OptimizationAlgorithm";
import { FitOptions } from "./FitOptions";
import { Shape } from "./Shape";
import { PreprocessOptions } from "./PreprocessOptions";
import { ClassifierEvaluationResultType } from "./EvaluationResultType";
import { SequentialClassifier } from "utils/common/models/AbstractClassifier/AbstractClassifier";
import { ModelStatus } from "./ModelType";

export type Classifier = {
  // pre-fit state
  selectedModel: SequentialClassifier;
  inputShape: Shape;
  preprocessOptions: PreprocessOptions;
  fitOptions: FitOptions;

  learningRate: number;
  lossFunction: LossFunction;
  optimizationAlgorithm: OptimizationAlgorithm;
  metrics: Array<Metric>;

  trainingPercentage: number;
  history?: History;
  // post-evaluation results
  evaluationResult: ClassifierEvaluationResultType;
  // status flags
  modelStatus: ModelStatus;
};
