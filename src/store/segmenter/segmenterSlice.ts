import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LossFunction } from "types/LossFunction";
import { Metric } from "types/Metric";
import { OptimizationAlgorithm } from "types/OptimizationAlgorithm";
import { History } from "@tensorflow/tfjs";
import { Shape } from "types/Shape";
import { availableSegmenterModels, ModelStatus } from "types/ModelType";
import { SegmenterEvaluationResultType } from "types/EvaluationResultType";
import { CropSchema } from "types/CropOptions";
import { SegmenterStoreType } from "types/SegmenterStoreType";
import { TrainingCallbacks } from "utils/common/models/Model";

export const initialState: SegmenterStoreType = {
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
    initialEpoch: 0,
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
        segmenter: SegmenterStoreType;
      }>
    ) {
      // WARNING, don't do below (overwrites draft object)
      // state = action.payload.segmenter;
      return action.payload.segmenter;
    },
    uploadUserSelectedModel(
      state,
      action: PayloadAction<{
        inputShape: Shape;
        model: (typeof availableSegmenterModels)[number];
      }>
    ) {
      const { model, inputShape } = action.payload;

      availableSegmenterModels.push(model);
      state.selectedModelIdx = availableSegmenterModels.length - 1;

      state.inputShape = inputShape;

      if (model.pretrained) {
        state.modelStatus = ModelStatus.Trained;
      }
    },

    updateModelStatus(
      state,
      action: PayloadAction<{
        modelStatus: ModelStatus;
        onEpochEnd?: TrainingCallbacks["onEpochEnd"]; // used by fit
        execSaga: boolean;
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
    updateSelectedModelIdx(state, action: PayloadAction<{ modelIdx: number }>) {
      state.selectedModelIdx = action.payload.modelIdx;
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
  },
});

export const {
  updateSegmentationBatchSize,
  updateSegmentationEpochs,
  updateSegmentationLearningRate,
  updateSegmentationLossFunction,
  updateSegmentationMetrics,
  updateSegmentationOptimizationAlgorithm,
  updateSegmentationTrainingPercentage,
  updateSegmentationEvaluationResult,
  updateFitted,
} = segmenterSlice.actions;
