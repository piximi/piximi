import { History, LayersModel, Scalar, Tensor } from "@tensorflow/tfjs";
import { LossFunction } from "./LossFunction";
import { Metric } from "./Metric";
import { OptimizationAlgorithm } from "./OptimizationAlgorithm";
import { FitOptions } from "./FitOptions";
import * as tensorflow from "@tensorflow/tfjs";

export type Classifier = {
  compiled?: LayersModel;
  compiling: boolean;
  data?: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor;
    ys: tensorflow.Tensor;
  }>;
  evaluating: boolean;
  evaluations?: Scalar | Array<Scalar>;
  fitOptions: FitOptions;
  fitted?: LayersModel;
  fitting: boolean;
  preprocessing: boolean;
  history?: History;
  learningRate: number;
  lossFunction:
    | LossFunction
    | Array<LossFunction>
    | { [outputName: string]: LossFunction };
  lossHistory?: Array<{ x: number; y: number }>;
  metrics: Array<Metric>;
  model?: LayersModel;
  opened?: LayersModel;
  opening: boolean;
  optimizationAlgorithm: OptimizationAlgorithm;
  predicting: boolean;
  predictions?: Tensor;
  saving: boolean;
  trainingPercentage: number;
  validationData?: tensorflow.data.Dataset<{
    xs: tensorflow.Tensor;
    ys: tensorflow.Tensor;
  }>;
  validationLossHistory?: Array<{ x: number; y: number }>;
  validationPercentage: number;
};
