import { createSlice, PayloadAction } from "@reduxjs/toolkit";

import {
  availableClassifierModels,
  deleteClassifierModels,
} from "utils/models/availableClassificationModels";

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
import { Kind, Shape } from "store/data/types";
import { DEFAULT_KIND } from "store/data/constants";

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
  selectedModelIdx: { [DEFAULT_KIND]: 0 },
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
    resetClassifiers: (state) => {
      const kindsToDelete = Object.keys(state.selectedModelIdx);
      deleteClassifierModels(kindsToDelete);
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
    setDefaults(state) {
      // TODO - segmenter: dispose() and state.selectedModel = SimpleCNN(), or whatever

      const kindsToDelete = Object.keys(state.selectedModelIdx);
      deleteClassifierModels(kindsToDelete);

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
    updateModelIdxDict(
      state,
      action: PayloadAction<{
        changes: { add?: Array<Kind["id"]>; del?: Array<Kind["id"]> };
      }>
    ) {
      const changes = action.payload.changes;
      if (changes.add) {
        changes.add.forEach((kid) => (state.selectedModelIdx[kid] = 0));
      }
      if (changes.del) {
        changes.del.forEach((kid) => delete state.selectedModelIdx[kid]);
      }
    },
    updateSelectedModelIdx(
      state,
      action: PayloadAction<{
        modelIdx: number;
        kindId: Kind["id"];
        disposePrevious: boolean;
      }>
    ) {
      const { modelIdx, kindId, disposePrevious } = action.payload;

      if (disposePrevious) {
        availableClassifierModels[kindId][
          state.selectedModelIdx[kindId]
        ].dispose();
      }

      state.selectedModelIdx[kindId] = modelIdx;
      const selectedModel = availableClassifierModels[kindId][modelIdx];

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
        activeKindId: Kind["id"];
        model: (typeof availableClassifierModels)[string][number];
      }>
    ) {
      const { inputShape, activeKindId, model } = action.payload;

      for (const kid of Object.keys(availableClassifierModels)) {
        availableClassifierModels[kid].push(model);
      }

      state.selectedModelIdx[activeKindId] =
        availableClassifierModels[activeKindId].length - 1;

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
