import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { History } from "@tensorflow/tfjs";
import { SegmenterState } from "store/types";
import {
  SegmenterEvaluationResultType,
  TrainingCallbacks,
} from "utils/models/types";
import {
  CropSchema,
  LossFunction,
  Metric,
  ModelStatus,
  OptimizationAlgorithm,
} from "utils/models/enums";
import { availableSegmenterModels } from "utils/models/availableSegmentationModels";
import { Shape } from "store/data/types";

export const initialState: SegmenterState = {
  selectedModelIdx: 0,
  inputShape: {
    height: 256,
    width: 256,
    channels: 3,
    planes: 1,
  },
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
  fitOptions: {
    epochs: 10,
    batchSize: 32,
  },
  compileOptions: {
    learningRate: 0.01,
    lossFunction: LossFunction.CategoricalCrossEntropy,
    metrics: [Metric.CategoricalAccuracy],
    optimizationAlgorithm: OptimizationAlgorithm.Adam,
  },
  trainingPercentage: 0.75,
  evaluationResult: {
    pixelAccuracy: -1,
    IoUScore: -1,
    diceScore: -1,
  },
  modelStatus: ModelStatus.Uninitialized,
};

export const segmenterSlice = createSlice({
  name: "segmenter",
  initialState: initialState,
  reducers: {
    resetSegmenter: () => initialState,
    setSegmenter(
      state,
      action: PayloadAction<{
        segmenter: SegmenterState;
      }>
    ) {
      // WARNING, don't do below (overwrites draft object)
      // state = action.payload.segmenter;
      return action.payload.segmenter;
    },
    loadUserSelectedModel(
      state,
      action: PayloadAction<{
        inputShape: Shape;
        model: (typeof availableSegmenterModels)[number];
      }>
    ) {
      const { model, inputShape } = action.payload;

      state.inputShape = inputShape;

      if (model.pretrained) {
        state.modelStatus = ModelStatus.Trained;
        const selectedModelIdx = availableSegmenterModels.findIndex(
          (m) => m.name === model.name
        );
        state.selectedModelIdx = selectedModelIdx >= 0 ? selectedModelIdx : 0;
      } else {
        availableSegmenterModels.push(model);
        state.selectedModelIdx = availableSegmenterModels.length - 1;
      }
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
    updateFitted(state, action: PayloadAction<{ history: History }>) {
      state.modelStatus = ModelStatus.Trained;

      state.trainingHistory = action.payload.history;
    },

    updateSegmentationBatchSize(
      state,
      action: PayloadAction<{ batchSize: number }>
    ) {
      state.fitOptions.batchSize = action.payload.batchSize;
    },
    updateSegmentationEpochs(state, action: PayloadAction<{ epochs: number }>) {
      state.fitOptions.epochs = action.payload.epochs;
    },
    updateSegmentationInputShape(
      state,
      action: PayloadAction<{ inputShape: Shape }>
    ) {
      state.inputShape = action.payload.inputShape;
    },
    updateSegmentationLearningRate(
      state,
      action: PayloadAction<{ learningRate: number }>
    ) {
      state.compileOptions.learningRate = action.payload.learningRate;
    },
    updateSegmentationLossFunction(
      state,
      action: PayloadAction<{ lossFunction: LossFunction }>
    ) {
      state.compileOptions.lossFunction = action.payload.lossFunction;
    },
    updateSegmentationMetrics(
      state,
      action: PayloadAction<{ metrics: Array<Metric> }>
    ) {
      state.compileOptions.metrics = action.payload.metrics;
    },
    updateSelectedModelIdx(
      state,
      action: PayloadAction<{ modelIdx: number; disposePrevious: boolean }>
    ) {
      const { modelIdx, disposePrevious } = action.payload;

      if (disposePrevious) {
        availableSegmenterModels[state.selectedModelIdx].dispose();
      }

      state.selectedModelIdx = modelIdx;
      const selectedModel = availableSegmenterModels[modelIdx];

      if (selectedModel.history.epochs.length > 0 || selectedModel.pretrained) {
        state.modelStatus = ModelStatus.Trained;
      } else {
        state.modelStatus = ModelStatus.Uninitialized;
      }
    },
    updateSegmentationOptimizationAlgorithm(
      state,
      action: PayloadAction<{ optimizationAlgorithm: OptimizationAlgorithm }>
    ) {
      state.compileOptions.optimizationAlgorithm =
        action.payload.optimizationAlgorithm;
    },
    updateSegmentationTrainingPercentage(
      state,
      action: PayloadAction<{ trainingPercentage: number }>
    ) {
      state.trainingPercentage = action.payload.trainingPercentage;
    },
    updateSegmentationEvaluationResult(
      state,
      action: PayloadAction<{ evaluationResult: SegmenterEvaluationResultType }>
    ) {
      state.evaluationResult = action.payload.evaluationResult;
    },
    updateShuffleOptions(state, action: PayloadAction<{ shuffle: boolean }>) {
      state.preprocessOptions.shuffle = action.payload.shuffle;
    },
  },
});
