import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import { availableClassifierModels } from "utils/models/availableClassificationModels";

import {
  CropSchema,
  LossFunction,
  Metric,
  ModelStatus,
  OptimizationAlgorithm,
} from "utils/models/enums";

import {
  ClassifierEvaluationResultType,
  CropOptions,
  RescaleOptions,
  TrainingCallbacks,
} from "utils/models/types";
import { ClassifierState } from "store/types";
import { Shape } from "store/data/types";

export const initialState: ClassifierState = {
  modelStatus: ModelStatus.Uninitialized,
  inputShape: {
    planes: 1,
    height: 64,
    width: 64,
    channels: 3,
  },
  fitOptions: {
    epochs: 10,
    batchSize: 32,
  },
  learningRate: 0.01,
  lossFunction: LossFunction.CategoricalCrossEntropy,
  selectedModelIdx: 0,
  metrics: [Metric.CategoricalAccuracy],
  optimizationAlgorithm: OptimizationAlgorithm.Adam,
  preprocessOptions: {
    shuffle: true,
    rescaleOptions: {
      rescale: true,
      center: false,
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
  showClearPredictionsWarning: true,
};

export const classifierSlice = createSlice({
  name: "classifier",
  initialState: initialState,
  reducers: {
    resetClassifier: (state) => {
      availableClassifierModels[state.selectedModelIdx].dispose();
      return initialState;
    },
    setClassifier(
      state,
      action: PayloadAction<{ classifier: ClassifierState }>
    ) {
      // WARNING, don't do below (overwrites draft object)
      // state = action.payload.classifier;
      return action.payload.classifier;
    },
    setDefaults(state, action: PayloadAction<{}>) {
      // TODO - segmenter: dispose() and state.selectedModel = SimpleCNN(), or whatever

      availableClassifierModels[state.selectedModelIdx].dispose();

      state.modelStatus = ModelStatus.Uninitialized;
      state.evaluationResult = {
        confusionMatrix: [],
        accuracy: -1,
        crossEntropy: -1,
        precision: -1,
        recall: -1,
        f1Score: -1,
      };
    },

    updateModelStatus(
      state,
      action: PayloadAction<{
        modelStatus: ModelStatus;
        onEpochEnd?: TrainingCallbacks["onEpochEnd"]; // used by fit
      }>
    ) {
      state.modelStatus = action.payload.modelStatus;
    },

    updateBatchSize(state, action: PayloadAction<{ batchSize: number }>) {
      const { batchSize } = action.payload;

      state.fitOptions.batchSize = batchSize;
    },
    updateEpochs(state, action: PayloadAction<{ epochs: number }>) {
      const { epochs } = action.payload;

      state.fitOptions.epochs = epochs;
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
    updateSelectedModelIdx(
      state,
      action: PayloadAction<{ modelIdx: number; disposePrevious: boolean }>
    ) {
      const { modelIdx, disposePrevious } = action.payload;

      if (disposePrevious) {
        availableClassifierModels[state.selectedModelIdx].dispose();
      }

      state.selectedModelIdx = modelIdx;
      const selectedModel = availableClassifierModels[modelIdx];

      if (selectedModel.history.epochs.length > 0 || selectedModel.pretrained) {
        state.modelStatus = ModelStatus.Trained;
      } else {
        state.modelStatus = ModelStatus.Uninitialized;
      }
    },
    loadUserSelectedModel(
      state,
      action: PayloadAction<{
        inputShape: Shape;
        model: (typeof availableClassifierModels)[number];
      }>
    ) {
      const { inputShape, model } = action.payload;

      availableClassifierModels.push(model);
      state.selectedModelIdx = availableClassifierModels.length - 1;

      state.inputShape = inputShape;

      if (model.pretrained || model.history.epochs.length > 0) {
        state.modelStatus = ModelStatus.Trained;
      } else {
        state.modelStatus = ModelStatus.Uninitialized;
      }
    },
    updateOptimizationAlgorithm(
      state,
      action: PayloadAction<{ optimizationAlgorithm: OptimizationAlgorithm }>
    ) {
      const { optimizationAlgorithm } = action.payload;

      state.optimizationAlgorithm = optimizationAlgorithm;
    },
    updateRescaleOptions(
      state,
      action: PayloadAction<{ rescaleOptions: RescaleOptions }>
    ) {
      state.preprocessOptions.rescaleOptions = action.payload.rescaleOptions;
    },
    updateShuffleOptions(state, action: PayloadAction<{ shuffle: boolean }>) {
      state.preprocessOptions.shuffle = action.payload.shuffle;
    },
    updateCropOptions(
      state,
      action: PayloadAction<{ cropOptions: CropOptions }>
    ) {
      state.preprocessOptions.cropOptions = action.payload.cropOptions;
    },
    updateTrainingPercentage(
      state,
      action: PayloadAction<{ trainingPercentage: number }>
    ) {
      const { trainingPercentage } = action.payload;

      state.trainingPercentage = trainingPercentage;
    },
    updateEvaluationResult(
      state,
      action: PayloadAction<{
        evaluationResult: ClassifierEvaluationResultType;
      }>
    ) {
      const { evaluationResult } = action.payload;

      state.evaluationResult = evaluationResult;
    },
    updateShowClearPredictionsWarning(
      state,
      action: PayloadAction<{ showClearPredictionsWarning: boolean }>
    ) {
      state.showClearPredictionsWarning =
        action.payload.showClearPredictionsWarning;
    },
  },
});
