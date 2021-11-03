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
import { RescaleOptions } from "../../types/RescaleOptions";

const initialState: Classifier = {
  compiling: false,
  evaluating: false,
  inputShape: {
    height: 256,
    width: 256,
    channels: 3,
    planes: 1,
    frames: 1,
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
  modelName: "ResNet",
  modelMultiplier: "0.0",
  modelVersion: "3",
  metrics: [Metric.CategoricalAccuracy],
  opening: false,
  optimizationAlgorithm: OptimizationAlgorithm.Adam,
  predicting: false,
  rescaleOptions: {
    rescale: true,
    rescaleMinMax: { min: 0, max: 1 },
  },
  saving: false,
  trainingPercentage: 0.5,
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
    predict(state, action: PayloadAction<{}>) {
      state.predicting = true;
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
    setClassifier(
      state,
      action: PayloadAction<{
        classifier: Classifier;
      }>
    ) {
      const { classifier } = action.payload;

      state.fitOptions = classifier.fitOptions;
      state.inputShape = classifier.inputShape;
      state.learningRate = classifier.learningRate;
      state.lossFunction = classifier.lossFunction;
      state.metrics = classifier.metrics;
      state.model = classifier.model;
      state.modelName = classifier.modelName;
      state.modelVersion = classifier.modelVersion;
      state.modelMultiplier = classifier.modelMultiplier;

      state.optimizationAlgorithm = classifier.optimizationAlgorithm;
      state.trainingPercentage = classifier.trainingPercentage;

      //initialize all others to false/undefined, since we are essentially initializing a new classifier
      state.compiling = classifier.compiling;
      state.evaluating = classifier.evaluating;
      state.evaluations = classifier.evaluations;
      state.fitting = classifier.fitting;
      state.history = classifier.history;
      state.opening = classifier.opening;
      state.predicting = classifier.predicting;
      state.predictions = classifier.predictions;
      state.preprocessing = classifier.preprocessing;
      state.saving = classifier.saving;
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
    updateModelName(state, action: PayloadAction<{ modelName: string }>) {
      state.modelName = action.payload.modelName;
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
    updateRescaleOptions(
      state,
      action: PayloadAction<{ rescaleOptions: RescaleOptions }>
    ) {
      state.rescaleOptions = action.payload.rescaleOptions;
    },
    updateTrainingPercentage(
      state,
      action: PayloadAction<{ trainingPercentage: number }>
    ) {
      const { trainingPercentage } = action.payload;

      state.trainingPercentage = trainingPercentage;
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
  updateTestPercentage,
} = classifierSlice.actions;
