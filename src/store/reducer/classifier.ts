import { ClassifierState, Loss, Metric, Optimizer } from "@piximi/types";
import { createReducer } from "@reduxjs/toolkit";

import * as actions from "../actions";

const state: ClassifierState = {
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
  lossFunction: Loss.CategoricalCrossentropy,
  lossHistory: [],
  metrics: [Metric.CategoricalAccuracy],
  opening: false,
  optimizationFunction: Optimizer.SGD,
  predicting: false,
  saving: false,
  trainingPercentage: 0.5,
  validationLossHistory: [],
  validationPercentage: 0.25,
};

export const reducer = createReducer(state, {
  [actions.compileAction.toString()]: (state) => {
    return {
      ...state,
      compiling: true,
    };
  },
  [actions.compiledAction.toString()]: (state, action) => {
    const { compiled } = action.payload;

    return {
      ...state,
      compiled: compiled,
      compiling: false,
    };
  },
  [actions.evaluateAction.toString()]: (state) => {
    return {
      ...state,
      evaluating: true,
    };
  },
  [actions.evaluatedAction.toString()]: (state, action) => {
    const { evaluations } = action.payload;

    return {
      ...state,
      evaluating: false,
      evaluations: evaluations,
    };
  },
  [actions.fitAction.toString()]: (state) => {
    return {
      ...state,
      fitting: true,
    };
  },
  [actions.fittedAction.toString()]: (state, action) => {
    const { fitted, history } = action.payload;

    return {
      ...state,
      fitted: fitted,
      fitting: false,
      history: history,
    };
  },
  [actions.generateAction.toString()]: (state) => {
    return {
      ...state,
      generating: true,
    };
  },
  [actions.generatedAction.toString()]: (state, action) => {
    const { data, validationData } = action.payload;

    return {
      ...state,
      data: data,
      generating: false,
      validationData: validationData,
    };
  },
  [actions.openAction.toString()]: (state) => {
    return {
      ...state,
      opening: true,
    };
  },
  [actions.openedAction.toString()]: (state, action) => {
    const { opened } = action.payload;

    return {
      ...state,
      opened: opened,
      opening: false,
    };
  },
  [actions.predictAction.toString()]: (state) => {
    return {
      ...state,
      predicting: true,
    };
  },
  [actions.predictedAction.toString()]: (state, action) => {
    const { predictions } = action.payload;

    return {
      ...state,
      predicting: false,
      predictions: predictions,
    };
  },
  [actions.saveAction.toString()]: (state) => {
    return {
      ...state,
      saving: true,
    };
  },
  [actions.savedAction.toString()]: (state, action) => {},
  [actions.updateBatchSizeAction.toString()]: (state, action) => {
    const { batchSize } = action.payload;
    state.fitOptions.batchSize = batchSize;
  },
  [actions.updateEpochsAction.toString()]: (state, action) => {
    const { epochs } = action.payload;
    state.fitOptions.epochs = epochs;
  },
  [actions.updateLearningRateAction.toString()]: (state, action) => {
    const { learningRate } = action.payload;

    return {
      ...state,
      learningRate: learningRate,
    };
  },
  [actions.updateLossFunctionAction.toString()]: (state, action) => {
    const { lossFunction } = action.payload;

    return {
      ...state,
      lossFunction: lossFunction,
    };
  },
  [actions.updateLossHistoryAction.toString()]: (state, action) => {
    const { batch, loss } = action.payload;

    return {
      ...state,
      lossHistory: [...state.lossHistory, { x: batch, y: loss }],
    };
  },
  [actions.updateMetricsAction.toString()]: (state, action) => {
    const { metrics } = action.payload;

    return {
      ...state,
      metrics: metrics,
    };
  },
  [actions.updateOptimizationFunctionAction.toString()]: (state, action) => {
    const { optimizationFunction } = action.payload;

    return {
      ...state,
      optimizationFunction: optimizationFunction,
    };
  },
  [actions.updateTrainingPercentageAction.toString()]: (state, action) => {
    const { trainingPercentage: trainingPercentage } = action.payload;

    return {
      ...state,
      trainingPercentage: trainingPercentage,
    };
  },
  [actions.updateValidationLossHistoryAction.toString()]: (state, action) => {
    const { batch, loss } = action.payload;

    return {
      ...state,
      validationLossHistory: [
        ...state.validationLossHistory,
        { x: batch, y: loss },
      ],
    };
  },
  [actions.updateValidationPercentageAction.toString()]: (state, action) => {
    const { validationPercentage } = action.payload;

    return {
      ...state,
      validationPercentage: validationPercentage,
    };
  },
});
