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
  compiled?: LayersModel;
  // TODO: image_data - not used
  trainDataSet?: Dataset<{
    xs: Tensor4D;
    ys: Tensor2D;
  }>;
  valDataSet?: Dataset<{
    xs: Tensor4D;
    ys: Tensor2D;
    // TODO: image_data - better if labels and ids are not necessary
    // labels: Tensor<Rank.R1>;
    // ids: Tensor<Rank.R1>;
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
