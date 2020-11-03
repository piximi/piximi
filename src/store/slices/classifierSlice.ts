import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Classifier } from "../../types/Classifier";
import { LossFunction } from "../../types/LossFunction";
import { Metric } from "../../types/Metric";
import { OptimizationAlgorithm } from "../../types/OptimizationAlgorithm";
import { Dataset } from "@tensorflow/tfjs-data";
import { History, LayersModel, Tensor } from "@tensorflow/tfjs";
import { CompileOptions } from "../../types/CompileOptions";
import { FitOptions } from "../../types/FitOptions";

const initialState: Classifier = {
  compiling: false,
  evaluating: false,
  fitOptions: {
    epochs: 1,
    batchSize: 32,
    initialEpoch: 0,
  },
  fitting: false,
  generating: false,
  learningRate: 0.01,
  lossFunction: LossFunction.SoftmaxCrossEntropy,
  lossHistory: [],
  metrics: [Metric.CategoricalAccuracy],
  opening: false,
  optimizationAlgorithm: OptimizationAlgorithm.StochasticGradientDescent,
  predicting: false,
  saving: false,
  trainingPercentage: 0.5,
  validationLossHistory: [],
  validationPercentage: 0.25,
};

export const classifierSlice = createSlice({
  name: "classifier",
  initialState: initialState,
  reducers: {
    compile(
      state,
      action: PayloadAction<{ opened: LayersModel; options: CompileOptions }>
    ) {
      state.compiling = true;
    },
    fit(
      state,
      action: PayloadAction<{
        callback?: any;
        compiled: LayersModel;
        data: Dataset<{ xs: Tensor; ys: Tensor }>;
        options: FitOptions;
        validationData: Dataset<{ xs: Tensor; ys: Tensor }>;
      }>
    ) {
      state.fitting = true;
    },
    open(
      state,
      action: PayloadAction<{
        pathname: string;
        classes: number;
        units: number;
      }>
    ) {
      state.opening = true;
    },
    preprocess(state) {
      state.generating = true;
    },
    updateBatchSize(state, action: PayloadAction<{ batchSize: number }>) {
      const { batchSize } = action.payload;

      state.fitOptions.batchSize = batchSize;
    },
    updateCompiled(state, action: PayloadAction<{ compiled: LayersModel }>) {
      const { compiled } = action.payload;

      state.compiled = compiled;

      state.compiling = false;
    },
    updateEpochs(state, action: PayloadAction<{ epochs: number }>) {
      const { epochs } = action.payload;

      state.fitOptions.epochs = epochs;
    },
    updateFitted(
      state,
      action: PayloadAction<{ fitted: LayersModel; status: History }>
    ) {
      const { fitted, status } = action.payload;

      state.compiling = false;

      state.fitted = fitted;

      state.history = status;
    },
    updateLearningRate(state, action: PayloadAction<{ learningRate: number }>) {
      const { learningRate } = action.payload;

      state.learningRate = learningRate;
    },
    updateLossFunction(
      state,
      action: PayloadAction<{ lossFunction: LossFunction }>
    ) {
      const { lossFunction } = action.payload;

      state.lossFunction = lossFunction;
    },
    updateLossHistory(
      state,
      action: PayloadAction<{ batch: number; loss: number }>
    ) {
      const { batch, loss } = action.payload;

      state.lossHistory = [...state.lossHistory!, { x: batch, y: loss }];
    },
    updateMetrics(state, action: PayloadAction<{ metrics: Array<Metric> }>) {
      const { metrics } = action.payload;

      state.metrics = metrics;
    },
    updateOpened(state, action: PayloadAction<{ opened: LayersModel }>) {
      const { opened } = action.payload;

      state.opened = opened;

      state.opening = false;
    },
    updateOptimizationAlgorithm(
      state,
      action: PayloadAction<{ optimizationAlgorithm: OptimizationAlgorithm }>
    ) {
      const { optimizationAlgorithm } = action.payload;

      state.optimizationAlgorithm = optimizationAlgorithm;
    },
    updatePreprocessed(
      state,
      action: PayloadAction<{
        data: Dataset<{ xs: Tensor; ys: Tensor }>;
        validationData?: Dataset<{ xs: Tensor; ys: Tensor }>;
      }>
    ) {
      const { data, validationData } = action.payload;

      state.data = data;
      state.generating = false;
      state.validationData = validationData;
    },
    updateTrainingPercentage(
      state,
      action: PayloadAction<{ trainingPercentage: number }>
    ) {
      const { trainingPercentage } = action.payload;

      state.trainingPercentage = trainingPercentage;
    },
    updateValidationLossHistory(
      state,
      action: PayloadAction<{ batch: number; loss: number }>
    ) {
      const { batch, loss } = action.payload;

      state.validationLossHistory = [
        ...state.validationLossHistory!,
        { x: batch, y: loss },
      ];
    },
    updateValidationPercentage(
      state,
      action: PayloadAction<{ validationPercentage: number }>
    ) {
      const { validationPercentage } = action.payload;

      state.validationPercentage = validationPercentage;
    },
  },
});
