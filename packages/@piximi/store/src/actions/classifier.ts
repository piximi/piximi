import {
  Category,
  CompileOptions,
  FitOptions,
  Image,
  Loss,
  Metric,
  Optimizer,
  ValidationOptions
} from "@piximi/types";
import {createAction} from "@reduxjs/toolkit";
import {History, LayersModel, Scalar, Tensor} from "@tensorflow/tfjs";
import {Dataset} from "@tensorflow/tfjs-data";

export const compileAction = createAction<{
  opened: LayersModel;
  options: CompileOptions;
}>("CLASSIFIER_COMPILE");

export const compiledAction = createAction<{
  compiled: LayersModel;
}>("CLASSIFIER_COMPILED");

export const evaluateAction = createAction<{
  fitted: LayersModel;
  data: Dataset<{xs: Tensor; ys: Tensor}>;
}>("CLASSIFIER_EVALUATE");

export const evaluatedAction = createAction<{
  evaluations: Scalar | Array<Scalar>;
}>("CLASSIFIER_EVALUATED");

export const fitAction = createAction<{
  compiled: LayersModel;
  data: Dataset<{xs: Tensor; ys: Tensor}>;
  validationData: Dataset<{xs: Tensor; ys: Tensor}>;
  options: FitOptions;
}>("CLASSIFIER_FIT");

export const fittedAction = createAction<{
  fitted: LayersModel;
  status: History;
}>("CLASSIFIER_FITTED");

export const generateAction = createAction<{}>("CLASSIFIER_GENERATE");

export const generatedAction = createAction<{
  data: Dataset<{xs: Tensor; ys: Tensor}>;
}>("CLASSIFIER_GENERATED");

export const openAction = createAction<{
  pathname: string;
  classes: number;
  units: number;
}>("CLASSIFIER_OPEN");

export const openedAction = createAction<{
  opened: LayersModel;
}>("CLASSIFIER_OPENED");

export const predictAction = createAction<{
  compiled: LayersModel;
  data: Dataset<{xs: Tensor; ys: Tensor}>;
}>("CLASSIFIER_PREDICT");

export const predictedAction = createAction<{
  predictions: Tensor;
}>("CLASSIFIER_PREDICTED");

export const updateLearningRateAction = createAction<{
  learningRate: number;
}>("CLASSIFIER_UPDATE_LEARNING_RATE");

export const updateLossFunctionAction = createAction<{
  lossFunction: Loss;
}>("CLASSIFIER_UPDATE_LOSS_FUNCTION");

export const updateMetricsAction = createAction<{
  metrics: Array<Metric>;
}>("CLASSIFIER_UPDATE_METRICS");

export const updateOptimizationFunctionAction = createAction<{
  optimizationFunction: Optimizer;
}>("CLASSIFIER_UPDATE_OPTIMIZATION_FUNCTION");

export const updateValidationPercentageAction = createAction<{
  validationPercentage: number;
}>("CLASSIFIER_UPDATE_VALIDATION_PERCENTAGE");

export const saveAction = createAction<{}>("CLASSIFIER_SAVE");

export const savedAction = createAction<{}>("CLASSIFIER_SAVED");
