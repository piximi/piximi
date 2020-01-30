import * as tensorflow from "@tensorflow/tfjs";
import {Dataset} from "@tensorflow/tfjs-data";
import {Tensor} from "@tensorflow/tfjs";
import {Scalar} from "@tensorflow/tfjs";
import {LayersModel} from "@tensorflow/tfjs";
import {History} from "@tensorflow/tfjs";

export type Project = {
  categories: Array<Category>;
  images: Array<Image>;
  name: string;
};

export type Category = {
  description: string;
  identifier: string;
  index: number;
  visualization: CategoryVisualization;
};

export type CategoryVisualization = {
  color: string;
  visible: boolean;
};

export type ClassifierState = {
  compiled?: LayersModel;
  compiling: boolean;
  data?: Dataset<{xs: Tensor; ys: Tensor}>;
  evaluating: boolean;
  evaluations?: Scalar | Array<Scalar>;
  fitOptions: FitOptions;
  fitted?: LayersModel;
  fitting: boolean;
  generating: boolean;
  history?: History;
  learningRate: number;
  lossFunction: Loss | Array<Loss> | {[outputName: string]: Loss};
  metrics: Array<Metric>;
  model?: LayersModel;
  opened?: LayersModel;
  opening: boolean;
  optimizationFunction: Optimizer;
  predicting: boolean;
  predictions?: Tensor;
  saving: boolean;
  validationData?: Dataset<{xs: Tensor; ys: Tensor}>;
  validationPercentage: number;
};

export type CompileOptions = {
  learningRate: number;
  lossFunction: Loss | Array<Loss> | {[outputName: string]: Loss};
  metrics: Array<Metric>;
  optimizationFunction: Optimizer;
};

export enum Optimizer {
  Adadelta = "Adadelta",
  Adagrad = "Adagrad",
  Adam = "Adam",
  Adamax = "Adamax",
  RMSProp = "RMSProp",
  SGD = "SGD"
}

export enum Loss {
  BinaryCrossentropy = "binaryCrossentropy",
  CategoricalCrossentropy = "categoricalCrossentropy",
  CategoricalHinge = "categoricalHinge",
  CosineProximity = "cosineProximity",
  Hinge = "hinge",
  KullbackLeiblerDivergence = "kullbackLeiblerDivergence",
  Logcosh = "logcosh",
  MeanAbsoluteError = "meanAbsoluteError",
  MeanAbsolutePercentageError = "meanAbsolutePercentageError",
  MeanSquaredError = "meanSquaredError",
  MeanSquaredLogarithmicError = "meanSquaredLogarithmicError",
  Poisson = "poisson",
  SparseCategoricalCrossentropy = "sparseCategoricalCrossentropy",
  SquaredHinge = "squaredHinge"
}

export enum Metric {
  BinaryAccuracy = "binaryAccuracy",
  CategoricalAccuracy = "categoricalAccuracy",
  CategoricalCrossentropy = "categoricalCrossentropy",
  Cosine = "cosine",
  MAE = "MAE",
  MAPE = "MAPE",
  MSE = "MSE",
  Precision = "precision",
  SparseCategoricalCrossentropy = "sparseCategoricalCrossentropy"
}

export const DefaultCompileOptions: CompileOptions = {
  learningRate: 0.01,
  lossFunction: Loss.BinaryCrossentropy,
  metrics: [Metric.BinaryAccuracy],
  optimizationFunction: Optimizer.Adadelta
};

export type FitOptions = {
  epochs: number;
  initialEpoch: number;
};

export const DefaultFitOptions: FitOptions = {
  epochs: 10,
  initialEpoch: 1
};

export type Image = {
  categoryIdentifier: string;
  checksum: string;
  data: string;
  identifier: string;
  partition: Partition;
  scores: Score[];
  visualization: ImageVisualization;
};

export type ImageVisualization = {
  brightness: number;
  contrast: number;
  visible: boolean;
  visibleChannels: number[];
};

export type Model = {
  compileOptions?: CompileOptions;
  fitOptions?: FitOptions;
  graph?: tensorflow.LayersModel;
  opened?: tensorflow.LayersModel;
  opening: boolean;
};

export enum Partition {
  Training,
  Validation,
  Test
}

export type Score = {
  categoryIdentifier: string;
  probability: number;
};

export type Settings = {
  spinner: {
    spinning: boolean;
  };
};

export type ValidationOptions = {
  validationPercentage: number;
};
