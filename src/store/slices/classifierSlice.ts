import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Classifier } from "../../types/Classifier";
import { LossFunction } from "../../types/LossFunction";
import { Metric } from "../../types/Metric";
import { OptimizationAlgorithm } from "../../types/OptimizationAlgorithm";
import * as tensorflow from "@tensorflow/tfjs";
import { History, LayersModel } from "@tensorflow/tfjs";
import { CompileOptions } from "../../types/CompileOptions";
import { Image } from "../../types/Image";
import { Category } from "../../types/Category";
import { Shape } from "../../types/Shape";
import { ArchitectureOptions } from "../../types/ArchitectureOptions";

const initialState: Classifier = {
  compiling: false,
  evaluating: false,
  inputShape: {
    r: 256,
    c: 256,
    channels: 3,
  },
  fitOptions: {
    epochs: 10,
    batchSize: 32,
    initialEpoch: 0,
    shuffle: true,
  },
  fitting: false,
  preprocessing: false,
  learningRate: 0.01,
  lossFunction: LossFunction.CategoricalCrossEntropy,
  lossHistory: [],
  modelName: "MobileNet",
  modelMultiplier: "0.0",
  modelVersion: "3",
  metrics: [Metric.CategoricalAccuracy],
  opening: false,
  optimizationAlgorithm: OptimizationAlgorithm.StochasticGradientDescent,
  predicting: false,
  saving: false,
  trainingPercentage: 0.5,
  validationLossHistory: [],
  testPercentage: 0.25,
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
        onEpochEnd: any;
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
    preprocess(
      state,
      action: PayloadAction<{
        images: Array<Image>;
        categories: Array<Category>;
      }>
    ) {
      state.preprocessing = true;
    },
    updateBatchSize(state, action: PayloadAction<{ batchSize: number }>) {
      const { batchSize } = action.payload;

      state.fitOptions.batchSize = batchSize;
    },
    updateClassifier(state, action: PayloadAction<{ classifier: Classifier }>) {
      const { classifier } = action.payload;

      state = classifier;
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
    updateInputShape(state, action: PayloadAction<{ inputShape: Shape }>) {
      state.inputShape = action.payload.inputShape;
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
    updateModel(
      state,
      action: PayloadAction<{ modelOptions: ArchitectureOptions }>
    ) {
      state.modelName = action.payload.modelOptions.modelName;
      state.modelVersion = action.payload.modelOptions.modelVersion;
      state.modelMultiplier = action.payload.modelOptions.modelMultiplier;
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
        data: tensorflow.data.Dataset<{
          xs: tensorflow.Tensor;
          ys: tensorflow.Tensor;
        }>;
      }>
    ) {
      const { data } = action.payload;

      state.data = data;

      state.preprocessing = false;
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
    updateTestPercentage(
      state,
      action: PayloadAction<{ testPercentage: number }>
    ) {
      const { testPercentage } = action.payload;

      state.testPercentage = testPercentage;
    },
  },
});

export const {
  compile,
  fit,
  open,
  preprocess,
  updateBatchSize,
  updateClassifier,
  updateCompiled,
  updateEpochs,
  updateFitted,
  updateLearningRate,
  updateLossFunction,
  updateMetrics,
  updateOpened,
  updateOptimizationAlgorithm,
  updatePreprocessed,
  updateTrainingPercentage,
  updateValidationLossHistory,
  updateTestPercentage,
} = classifierSlice.actions;
