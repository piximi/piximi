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

export type Classifier = {
  compiled?: LayersModel;
  compiling: boolean;
  data?:
    | tensorflow.data.Dataset<{
        xs: tensorflow.Tensor;
        ys: tensorflow.Tensor;
      }>
    | Array<Tensor2D>;
  evaluating: boolean;
  evaluations?: Scalar | Array<Scalar>;
  fitOptions: FitOptions;
  fitted?: LayersModel;
  fitting: boolean;
  inputShape: Shape;
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
  modelName?: string;
  modelMultiplier?: string;
  modelVersion?: string;
  opened?: LayersModel;
  opening: boolean;
  optimizationAlgorithm: OptimizationAlgorithm;
  predicting: boolean;
  predictions?: Tensor;
  saving: boolean;
  trainingPercentage: number;
  validationData?:
    | tensorflow.data.Dataset<{
        xs: tensorflow.Tensor;
        ys: tensorflow.Tensor;
      }>
    | Array<Tensor2D>;
  validationLossHistory?: Array<{ x: number; y: number }>;
  testPercentage: number;
};
