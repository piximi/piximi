import {
  History,
  LayersModel,
  Tensor,
  Tensor2D,
  Tensor4D,
} from "@tensorflow/tfjs";
import { Dataset } from "@tensorflow/tfjs-data";
import { LossFunction } from "./LossFunction";
import { Metric } from "./Metric";
import { OptimizationAlgorithm } from "./OptimizationAlgorithm";
import { FitOptions } from "./FitOptions";
import { Shape } from "./Shape";
import { PreprocessOptions } from "./PreprocessOptions";
import { ClassifierModelProps } from "./ModelType";
import { ClassifierEvaluationResultType } from "./EvaluationResultType";

export type Classifier = {
  // pre-fit state
  userUploadedModel?: ClassifierModelProps;
  selectedModel: ClassifierModelProps;
  inputShape: Shape;
  preprocessOptions: PreprocessOptions;
  fitOptions: FitOptions;
  learningRate: number;
  lossFunction: LossFunction;
  optimizationAlgorithm: OptimizationAlgorithm;
  trainingPercentage: number;
  metrics: Array<Metric>;
  // post-fit results
  compiled?: LayersModel;
  history?: History;
  // post-evaluation results
  evaluationResult: ClassifierEvaluationResultType;
  // post-prediction results
  predictions?: Tensor;
  // status flags
  fitting: boolean;
  fitted?: LayersModel;
  evaluating: boolean;
  predicting: boolean;
  predicted: boolean;
};
