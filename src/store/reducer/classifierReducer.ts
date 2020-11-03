import { createReducer } from "@reduxjs/toolkit";
import {
  compileModelAction,
  compiledModelAction,
  fitModelAction,
  fittedModelAction,
  preprocessModelAction,
  preprocessedModelAction,
  openModelAction,
  openedModelAction,
  updateBatchSizeAction,
  updateEpochsAction,
  updateLearningRateAction,
  updateLossFunctionAction,
  updateLossHistoryAction,
  updateMetricsAction,
  updateOptimizationAlgorithmAction,
  updateTrainingPercentageAction,
  updateValidationLossHistoryAction,
  updateValidationPercentageAction,
} from "../actions";
import { LossFunction } from "../../types/LossFunction";
import { Metric } from "../../types/Metric";
import { OptimizationAlgorithm } from "../../types/OptimizationAlgorithm";
import { Classifier } from "../../types/Classifier";

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

export const classifierReducer = createReducer(initialState, {
  [compileModelAction.type]: (state) => {
    return {
      ...state,
      compiling: true,
    };
  },
  [compiledModelAction.type]: (state, action) => {
    const { compiled } = action.payload;

    return {
      ...state,
      compiled: compiled,
      compiling: false,
    };
  },
  [fitModelAction.type]: (state) => {
    return {
      ...state,
      fitting: true,
    };
  },
  [fittedModelAction.type]: (state, action) => {
    const { fitted, history } = action.payload;

    return {
      ...state,
      fitted: fitted,
      fitting: false,
      history: history,
    };
  },
  [preprocessModelAction.type]: (state) => {
    return {
      ...state,
      generating: true,
    };
  },
  [preprocessedModelAction.type]: (state, action) => {
    const { data, validationData } = action.payload;

    return {
      ...state,
      data: data,
      generating: false,
      validationData: validationData,
    };
  },
  [openModelAction.type]: (state) => {
    return {
      ...state,
      opening: true,
    };
  },
  [openedModelAction.type]: (state, action) => {
    const { opened } = action.payload;

    return {
      ...state,
      opened: opened,
      opening: false,
    };
  },
  [updateBatchSizeAction.type]: (state, action) => {
    const { batchSize } = action.payload;
    state.fitOptions.batchSize = batchSize;
  },
  [updateEpochsAction.type]: (state, action) => {
    const { epochs } = action.payload;
    state.fitOptions.epochs = epochs;
  },
  [updateLearningRateAction.type]: (state, action) => {
    const { learningRate } = action.payload;

    return {
      ...state,
      learningRate: learningRate,
    };
  },
  [updateLossFunctionAction.type]: (state, action) => {
    const { lossFunction } = action.payload;

    return {
      ...state,
      lossFunction: lossFunction,
    };
  },
  [updateLossHistoryAction.type]: (state, action) => {
    const { batch, loss } = action.payload;

    return {
      ...state,
      lossHistory: [...state.lossHistory!, { x: batch, y: loss }],
    };
  },
  [updateMetricsAction.type]: (state, action) => {
    const { metrics } = action.payload;

    return {
      ...state,
      metrics: metrics,
    };
  },
  [updateOptimizationAlgorithmAction.type]: (state, action) => {
    const { optimizationFunction } = action.payload;

    return {
      ...state,
      optimizationFunction: optimizationFunction,
    };
  },
  [updateTrainingPercentageAction.type]: (state, action) => {
    const { trainingPercentage } = action.payload;

    return {
      ...state,
      trainingPercentage: trainingPercentage,
    };
  },
  [updateValidationLossHistoryAction.type]: (state, action) => {
    const { batch, loss } = action.payload;

    return {
      ...state,
      validationLossHistory: [
        ...state.validationLossHistory!,
        { x: batch, y: loss },
      ],
    };
  },
  [updateValidationPercentageAction.type]: (state, action) => {
    const { validationPercentage } = action.payload;

    return {
      ...state,
      validationPercentage: validationPercentage,
    };
  },
});
