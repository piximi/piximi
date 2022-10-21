import { History, LayersModel, Rank, Tensor } from "@tensorflow/tfjs";
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
  compiled?: LayersModel;
  trainDataSet?: Dataset<{
    xs: Tensor;
    ys: Tensor;
    labels: Tensor;
    ids: Tensor;
  }>;
  valDataSet?: Dataset<{
    xs: Tensor;
    ys: Tensor;
    labels: Tensor<Rank.R1>;
    ids: Tensor<Rank.R1>;
  }>;
  evaluating: boolean;
  fitOptions: FitOptions;
  fitted?: LayersModel;
  fitting: boolean;
  inputShape: Shape;
  history?: History;
  learningRate: number;
  lossFunction: LossFunction;
  metrics: Array<Metric>;
  selectedModel: ClassifierModelProps;
  userUploadedModel?: ClassifierModelProps;
  optimizationAlgorithm: OptimizationAlgorithm;
  predicting: boolean;
  predictions?: Tensor;
  predicted: boolean;
  trainingPercentage: number;
  evaluationResult: ClassifierEvaluationResultType;
  preprocessOptions: PreprocessOptions;
};
