import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Classifier } from "../../types/Classifier";
import { LossFunction } from "../../types/LossFunction";
import { Metric } from "../../types/Metric";
import { OptimizationAlgorithm } from "../../types/OptimizationAlgorithm";
import * as tensorflow from "@tensorflow/tfjs";
import { History, LayersModel } from "@tensorflow/tfjs";
import { Shape } from "../../types/Shape";
import { RescaleOptions } from "../../types/RescaleOptions";
import {
  availableModels,
  ClassifierModelProps,
} from "../../types/ClassifierModelType";
import { EvaluationResultType } from "types/EvaluationResultType";
import { CropSchema } from "types/CropOptions";

const initialState: Classifier = {
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
  },
  fitting: false,
  learningRate: 0.01,
  lossFunction: LossFunction.CategoricalCrossEntropy,
  selectedModel: availableModels[0],
  metrics: [Metric.CategoricalAccuracy],
  optimizationAlgorithm: OptimizationAlgorithm.Adam,
  predicting: false,
  predicted: false,
  preprocessOptions: {
    shuffle: true,
    rescaleOptions: {
      rescale: true,
      rescaleMinMax: { min: 0, max: 1 },
    },
    cropOptions: {
      numCrops: 1,
      cropSchema: CropSchema.None,
    },
  },
  trainingPercentage: 0.75,
  evaluationResult: {
    confusionMatrix: [],
    accuracy: -1,
    crossEntropy: -1,
    precision: -1,
    recall: -1,
    f1Score: -1,
  },
};

export const classifierSlice = createSlice({
  name: "classifier",
  initialState: initialState,
  reducers: {
    resetClassifier: () => initialState,
    fit(
      state,
      action: PayloadAction<{
        onEpochEnd: any;
      }>
    ) {
      state.fitting = true;
    },
    predict(state, action: PayloadAction<{}>) {
      state.predicting = true;
    },
    evaluate(state, action: PayloadAction<{}>) {
      state.evaluating = true;
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

      state.optimizationAlgorithm = classifier.optimizationAlgorithm;
      state.trainingPercentage = classifier.trainingPercentage;
      state.history = classifier.history;
      state.predictions = classifier.predictions;
      state.predicted = classifier.predicted;
      state.preprocessOptions = classifier.preprocessOptions;

      state.selectedModel = availableModels[0];
      if (classifier.selectedModel) {
        const selectedModel = classifier.selectedModel;
        availableModels.forEach((model) => {
          if (
            selectedModel.modelType === model.modelType &&
            selectedModel.modelName === model.modelName
          ) {
            state.selectedModel = selectedModel;
          }
        });
      }

      // initialize all others to their default value
      state.evaluating = false;
      state.fitting = false;
      state.predicting = false;
      state.compiled = undefined;
      state.fitted = undefined;
      state.userUploadedModel = undefined;
      state.evaluationResult = {
        confusionMatrix: [],
        accuracy: -1,
        crossEntropy: -1,
        precision: -1,
        recall: -1,
        f1Score: -1,
      };
    },
    updateBatchSize(state, action: PayloadAction<{ batchSize: number }>) {
      const { batchSize } = action.payload;

      state.fitOptions.batchSize = batchSize;
    },
    updateCompiled(state, action: PayloadAction<{ compiled: LayersModel }>) {
      const { compiled } = action.payload;

      state.compiled = compiled;
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

      state.fitted = fitted;

      state.history = status;

      state.fitting = false;
    },
    updateFitting(state, action: PayloadAction<{ fitting: boolean }>) {
      state.fitting = false;
    },
    addFitted(state, action: PayloadAction<{ fitted: LayersModel }>) {
      const { fitted } = action.payload;

      state.fitted = fitted;
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
    updateSelectedModel(
      state,
      action: PayloadAction<{ model: ClassifierModelProps }>
    ) {
      state.selectedModel = action.payload.model;
    },
    updatePredicted(state, action: PayloadAction<{ predicted: boolean }>) {
      state.predicted = action.payload.predicted;
    },
    uploadUserSelectedModel(
      state,
      action: PayloadAction<{
        inputShape: Shape;
        modelSelection: ClassifierModelProps;
        model: LayersModel;
      }>
    ) {
      state.inputShape = action.payload.inputShape;
      state.fitted = action.payload.model;
      state.compiled = action.payload.model;
      state.selectedModel = action.payload.modelSelection;
      state.userUploadedModel = action.payload.modelSelection;
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
        data: {
          val: tensorflow.data.Dataset<{
            xs: tensorflow.Tensor<tensorflow.Rank.R4>;
            ys: tensorflow.Tensor<tensorflow.Rank.R2>;
            labels: tensorflow.Tensor<tensorflow.Rank.R1>;
            ids: tensorflow.Tensor<tensorflow.Rank.R1>;
          }>;
          train: tensorflow.data.Dataset<{
            xs: tensorflow.Tensor<tensorflow.Rank.R4>;
            ys: tensorflow.Tensor<tensorflow.Rank.R2>;
            labels: tensorflow.Tensor<tensorflow.Rank.R1>;
            ids: tensorflow.Tensor<tensorflow.Rank.R1>;
          }>;
        };
      }>
    ) {
      const { data } = action.payload;

      state.trainDataSet = data.train;
      state.valDataSet = data.val;
    },
    updateRescaleOptions(
      state,
      action: PayloadAction<{ rescaleOptions: RescaleOptions }>
    ) {
      state.preprocessOptions.rescaleOptions = action.payload.rescaleOptions;
    },
    updateTrainingPercentage(
      state,
      action: PayloadAction<{ trainingPercentage: number }>
    ) {
      const { trainingPercentage } = action.payload;

      state.trainingPercentage = trainingPercentage;
    },
    updateEvaluating(state, action: PayloadAction<{ evaluating: boolean }>) {
      const { evaluating } = action.payload;

      state.evaluating = evaluating;
    },
    updatePredicting(state, action: PayloadAction<{ predicting: boolean }>) {
      const { predicting } = action.payload;

      state.predicting = predicting;
    },
    updateEvaluationResult(
      state,
      action: PayloadAction<{ evaluationResult: EvaluationResultType }>
    ) {
      const { evaluationResult } = action.payload;

      state.evaluationResult = evaluationResult;
    },
  },
});

export const {
  fit,
  updateBatchSize,
  updateCompiled,
  updateEpochs,
  updateFitted,
  updateLearningRate,
  updateLossFunction,
  updateMetrics,
  updateOptimizationAlgorithm,
  updatePreprocessed,
  updateTrainingPercentage,
} = classifierSlice.actions;
