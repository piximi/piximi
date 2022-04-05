import {
  History,
  LayersModel,
  Scalar,
  Tensor,
  Tensor2D,
} from "@tensorflow/tfjs";
import { LossFunction } from "./LossFunction";
import { Metric } from "./Metric";
import { OptimizationAlgorithm } from "./OptimizationAlgorithm";
import { FitOptions } from "./FitOptions";
import * as tensorflow from "@tensorflow/tfjs";
import { Shape } from "./Shape";
import { RescaleOptions } from "./RescaleOptions";
import { ClassifierModelProps } from "./ClassifierModelType";
import { EvaluationResultType } from "./EvaluationResultType";

export type Classifier = {
  compiled?: LayersModel;
  trainDataSet?: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor;
    ys: tensorflow.Tensor;
  }>;
  valDataSet?: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor;
    ys: tensorflow.Tensor;
  }>;
  evaluating: boolean;
  evaluations?: Scalar | Array<Scalar>;
  fitOptions: FitOptions;
  fitted?: LayersModel;
  fitting: boolean;
  inputShape: Shape;
  history?: History;
  learningRate: number;
  lossFunction:
    | LossFunction
    | Array<LossFunction>
    | { [outputName: string]: LossFunction };
  metrics: Array<Metric>;
  selectedModel: ClassifierModelProps;
  userUploadedModel?: ClassifierModelProps;
  optimizationAlgorithm: OptimizationAlgorithm;
  predicting: boolean;
  predictions?: Tensor;
  predicted: boolean;
  rescaleOptions: RescaleOptions;
  trainingPercentage: number;
  evaluationResult: EvaluationResultType;
};
