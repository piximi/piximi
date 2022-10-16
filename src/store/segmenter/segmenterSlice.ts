import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { LossFunction } from "types/LossFunction";
import { Metric } from "types/Metric";
import { OptimizationAlgorithm } from "types/OptimizationAlgorithm";
import { History, LayersModel, Tensor, data, Rank } from "@tensorflow/tfjs";
import { Shape } from "types/Shape";
import { availableSegmenterModels, SegmenterModelProps } from "types/ModelType";
import { SegmenterEvaluationResultType } from "types/EvaluationResultType";
import { CropSchema } from "types/CropOptions";
import { SegmenterStoreType } from "types/SegmenterStoreType";

const initialState: SegmenterStoreType = {
  fitting: false,
  evaluating: false,
  predicting: false,
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
  compileOptions: {
    learningRate: 0.01,
    lossFunction: LossFunction.CategoricalCrossEntropy,
    metrics: [Metric.CategoricalAccuracy],
    optimizationAlgorithm: OptimizationAlgorithm.Adam,
  },
  fitOptions: {
    epochs: 10,
    batchSize: 32,
    initialEpoch: 0,
  },
  inputShape: {
    height: 256,
    width: 256,
    channels: 3,
    planes: 1,
  },
  trainingPercentage: 0.75,
  predicted: false,
  evaluationResult: {
    pixelAccuracy: -1,
    IoUScore: -1,
    diceScore: -1,
  },
  compiled: undefined,
  fitted: undefined,
  selectedModel: availableSegmenterModels[0],
  userUploadedModel: undefined,
};

export const segmenterSlice = createSlice({
  name: "segmenter",
  initialState: initialState,
  reducers: {
    resetSegmenter: () => initialState,
    fitSegmenter(
      state,
      action: PayloadAction<{
        onEpochEnd: any;
        execSaga: boolean;
      }>
    ) {
      state.fitting = true;
    },
    predictSegmenter(state, action: PayloadAction<{ execSaga: boolean }>) {
      state.predicting = true;
    },
    evaluateSegmenter(state, action: PayloadAction<{ execSaga: boolean }>) {
      state.evaluating = true;
    },
    setSegmenter(
      state,
      action: PayloadAction<{
        segmenter: SegmenterStoreType;
      }>
    ) {
      const { segmenter } = action.payload;

      state.compileOptions = segmenter.compileOptions;
      state.fitOptions = segmenter.fitOptions;
      state.inputShape = segmenter.inputShape;
      state.trainingPercentage = segmenter.trainingPercentage;
      state.trainingHistory = segmenter.trainingHistory;
      state.predicted = segmenter.predicted;
      state.preprocessOptions = segmenter.preprocessOptions;

      state.selectedModel = availableSegmenterModels[0];
      if (segmenter.selectedModel) {
        const selectedModel = segmenter.selectedModel;
        availableSegmenterModels.forEach((model) => {
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
        pixelAccuracy: -1,
        IoUScore: -1,
        diceScore: -1,
      };
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
    updateSelectedModel(
      state,
      action: PayloadAction<{ model: SegmenterModelProps }>
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
        modelSelection: SegmenterModelProps;
        model: LayersModel;
      }>
    ) {
      state.inputShape = action.payload.inputShape;
      state.fitted = action.payload.model;
      state.compiled = action.payload.model;
      state.selectedModel = action.payload.modelSelection;
      state.userUploadedModel = action.payload.modelSelection;
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
    updateCompiled(state, action: PayloadAction<{ compiled: LayersModel }>) {
      state.compiled = action.payload.compiled;
    },
    updateFitted(
      state,
      action: PayloadAction<{ fitted: LayersModel; trainingHistory: History }>
    ) {
      state.fitted = action.payload.fitted;

      state.trainingHistory = action.payload.trainingHistory;

      state.fitting = false;
    },
    updateFitting(state, action: PayloadAction<{ fitting: boolean }>) {
      state.fitting = action.payload.fitting;
    },
    updatePredicting(state, action: PayloadAction<{ predicting: boolean }>) {
      state.predicting = action.payload.predicting;
    },
    updateEvaluating(state, action: PayloadAction<{ evaluating: boolean }>) {
      state.evaluating = action.payload.evaluating;
    },
    updatePreprocessedSegmentationData(
      state,
      action: PayloadAction<{
        data: {
          val: data.Dataset<{
            xs: Tensor<Rank.R4>;
            ys: Tensor<Rank.R4>;
            id: Tensor<Rank.R1>;
          }>;
          train: data.Dataset<{
            xs: Tensor<Rank.R4>;
            ys: Tensor<Rank.R4>;
            id: Tensor<Rank.R1>;
          }>;
        };
      }>
    ) {
      const { data } = action.payload;

      state.trainDataSet = data.train;
      state.valDataSet = data.val;
    },
  },
});

export const {
  fitSegmenter,
  evaluateSegmenter,
  predictSegmenter,
  updateSegmentationBatchSize,
  updateSegmentationEpochs,
  updateSegmentationLearningRate,
  updateSegmentationLossFunction,
  updateSegmentationMetrics,
  updateSegmentationOptimizationAlgorithm,
  updateSegmentationTrainingPercentage,
  updateSegmentationEvaluationResult,
  updateCompiled,
  updateFitted,
  updateFitting,
  updatePredicted,
  updatePredicting,
  updateEvaluating,
  updatePreprocessedSegmentationData,
} = segmenterSlice.actions;
