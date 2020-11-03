import {
  configureStore,
  EnhancedStore,
  Middleware,
  StoreEnhancer,
} from "@reduxjs/toolkit";
import logger from "redux-logger";
import createSagaMiddleware from "redux-saga";
import thunk from "redux-thunk";

import { reducer } from "../reducer";
import { root } from "../sagas";
import {
  ClassifierState,
  Loss,
  Metric,
  Optimizer,
  Project,
} from "@piximi/types";

const saga = createSagaMiddleware();

const enhancers: Array<StoreEnhancer> = [];

const middleware: Array<Middleware> = [logger, saga, thunk];

const classifier: ClassifierState = {
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
  metrics: [Metric.CategoricalAccuracy],
  opening: false,
  optimizationFunction: Optimizer.SGD,
  predicting: false,
  saving: false,
  trainingPercentage: 0.5,
  validationPercentage: 0.25,
};

const project: Project = {
  categories: [],
  images: [],
  name: "example",
};

const preloadedState = {
  classifier: classifier,
  project: project,
};

const options = {
  devTools: true,
  enhancers: enhancers,
  middleware: middleware,
  preloadedState: preloadedState,
  reducer: reducer,
};

export const testStore: EnhancedStore = configureStore(options);

saga.run(root);
