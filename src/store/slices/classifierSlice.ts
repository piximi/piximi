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

const classifierSlice = createSlice({
  name: "model",
  initialState: initialState,
  reducers: {
    compileClassifierAction(
      state,
      action: PayloadAction<{ opened: LayersModel; options: CompileOptions }>
    ) {
      state.compiling = true;
    },
    fitClassifierAction(
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
    openClassifierAction(
      state,
      action: PayloadAction<{
        pathname: string;
        classes: number;
        units: number;
      }>
    ) {
      state.opening = true;
    },
    preprocessClassifierAction(state) {
      state.generating = true;
    },
    updateClassifierBatchSizeAction(
      state,
      action: PayloadAction<{ batchSize: number }>
    ) {
      const { batchSize } = action.payload;

      state.fitOptions.batchSize = batchSize;
    },
    updateClassifierCompiledAction(
      state,
      action: PayloadAction<{ compiled: LayersModel }>
    ) {
      const { compiled } = action.payload;

      state.compiled = compiled;

      state.compiling = false;
    },
    updateClassifierEpochsAction(
      state,
      action: PayloadAction<{ epochs: number }>
    ) {
      const { epochs } = action.payload;

      state.fitOptions.epochs = epochs;
    },
    updateClassifierFittedAction(
      state,
      action: PayloadAction<{ fitted: LayersModel; history: History }>
    ) {
      const { fitted, history } = action.payload;

      state.compiling = false;

      state.fitted = fitted;

      state.history = history;
    },
    updateClassifierLearningRateAction(
      state,
      action: PayloadAction<{ learningRate: number }>
    ) {
      const { learningRate } = action.payload;

      state.learningRate = learningRate;
    },
    updateClassifierLossFunctionAction(
      state,
      action: PayloadAction<{ lossFunction: LossFunction }>
    ) {
      const { lossFunction } = action.payload;

      state.lossFunction = lossFunction;
    },
    updateClassifierLossHistoryAction(
      state,
      action: PayloadAction<{ batch: number; loss: number }>
    ) {
      const { batch, loss } = action.payload;

      state.lossHistory = [...state.lossHistory!, { x: batch, y: loss }];
    },
    updateClassifierMetricsAction(
      state,
      action: PayloadAction<{ metrics: Array<Metric> }>
    ) {
      const { metrics } = action.payload;

      state.metrics = metrics;
    },
    updateClassifierOpenedAction(
      state,
      action: PayloadAction<{ opened: LayersModel }>
    ) {
      const { opened } = action.payload;

      state.opened = opened;

      state.opening = false;
    },
    updateClassifierOptimizationAlgorithmAction(
      state,
      action: PayloadAction<{ optimizationAlgorithm: OptimizationAlgorithm }>
    ) {
      const { optimizationAlgorithm } = action.payload;

      state.optimizationAlgorithm = optimizationAlgorithm;
    },
    updateClassifierPreprocessedAction(
      state,
      action: PayloadAction<{
        data: Dataset<{ xs: Tensor; ys: Tensor }>;
        validationData: Dataset<{ xs: Tensor; ys: Tensor }>;
      }>
    ) {
      const { data, validationData } = action.payload;

      state.data = data;
      state.generating = false;
      state.validationData = validationData;
    },
    updateClassifierTrainingPercentageAction(
      state,
      action: PayloadAction<{ trainingPercentage: number }>
    ) {
      const { trainingPercentage } = action.payload;

      state = {
        ...state,
        trainingPercentage: trainingPercentage,
      };
    },
    updateClassifierValidationLossHistoryAction(
      state,
      action: PayloadAction<{ batch: number; loss: number }>
    ) {
      const { batch, loss } = action.payload;

      state = {
        ...state,
        validationLossHistory: [
          ...state.validationLossHistory!,
          { x: batch, y: loss },
        ],
      };
    },
    updateClassifierValidationPercentageAction(
      state,
      action: PayloadAction<{ validationPercentage: number }>
    ) {
      const { validationPercentage } = action.payload;

      state = {
        ...state,
        validationPercentage: validationPercentage,
      };
    },
  },
});

export const {
  compileClassifierAction,
  fitClassifierAction,
  openClassifierAction,
  preprocessClassifierAction,
  updateClassifierBatchSizeAction,
  updateClassifierCompiledAction,
  updateClassifierEpochsAction,
  updateClassifierFittedAction,
  updateClassifierLearningRateAction,
  updateClassifierLossFunctionAction,
  updateClassifierLossHistoryAction,
  updateClassifierMetricsAction,
  updateClassifierOpenedAction,
  updateClassifierOptimizationAlgorithmAction,
  updateClassifierPreprocessedAction,
  updateClassifierTrainingPercentageAction,
  updateClassifierValidationLossHistoryAction,
  updateClassifierValidationPercentageAction,
} = classifierSlice.actions;

export const classifierReducer = classifierSlice.reducer;
