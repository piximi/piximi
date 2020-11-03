import { History, LayersModel, Scalar, Tensor } from "@tensorflow/tfjs";
import { Dataset } from "@tensorflow/tfjs-data";
import { LossFunction } from "./LossFunction";
import { Metric } from "./Metric";
import { OptimizationAlgorithm } from "./OptimizationAlgorithm";
import { FitOptions } from "./FitOptions";

export type Classifier = {
  compiled?: LayersModel;
  compiling: boolean;
  data?: Dataset<{ xs: Tensor; ys: Tensor }>;
  evaluating: boolean;
  evaluations?: Scalar | Array<Scalar>;
  fitOptions: FitOptions;
  fitted?: LayersModel;
  fitting: boolean;
  generating: boolean;
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
  validationData?: Dataset<{ xs: Tensor; ys: Tensor }>;
  validationLossHistory?: Array<{ x: number; y: number }>;
  validationPercentage: number;
};
