import { createReducer } from "@reduxjs/toolkit";
import {
  compileAction,
  compiledAction,
  evaluateAction,
  evaluatedAction,
  fitAction,
  fittedAction,
  generateAction,
  generatedAction,
  openAction,
  openedAction,
  predictAction,
  predictedAction,
  saveAction,
  savedAction,
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
  [compileAction.type]: (state) => {
    return {
      ...state,
      compiling: true,
    };
  },
  [compiledAction.type]: (state, action) => {
    const { compiled } = action.payload;

    return {
      ...state,
      compiled: compiled,
      compiling: false,
    };
  },
  [evaluateAction.type]: (state) => {
    return {
      ...state,
      evaluating: true,
    };
  },
  [evaluatedAction.type]: (state, action) => {
    const { evaluations } = action.payload;

    return {
      ...state,
      evaluating: false,
      evaluations: evaluations,
    };
  },
  [fitAction.type]: (state) => {
    return {
      ...state,
      fitting: true,
    };
  },
  [fittedAction.type]: (state, action) => {
    const { fitted, history } = action.payload;

    return {
      ...state,
      fitted: fitted,
      fitting: false,
      history: history,
    };
  },
  [generateAction.type]: (state) => {
    return {
      ...state,
      generating: true,
    };
  },
  [generatedAction.type]: (state, action) => {
    const { data, validationData } = action.payload;

    return {
      ...state,
      data: data,
      generating: false,
      validationData: validationData,
    };
  },
  [openAction.type]: (state) => {
    return {
      ...state,
      opening: true,
    };
  },
  [openedAction.type]: (state, action) => {
    const { opened } = action.payload;

    return {
      ...state,
      opened: opened,
      opening: false,
    };
  },
  [predictAction.type]: (state) => {
    return {
      ...state,
      predicting: true,
    };
  },
  [predictedAction.type]: (state, action) => {
    const { predictions } = action.payload;

    return {
      ...state,
      predicting: false,
      predictions: predictions,
    };
  },
  [saveAction.type]: (state) => {
    return {
      ...state,
      saving: true,
    };
  },
  [savedAction.type]: (state, action) => {},
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
