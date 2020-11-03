import {
  configureStore,
  EnhancedStore,
  Middleware,
  StoreEnhancer,
} from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import logger from "redux-logger";
import { root } from "./store/sagas";
import { reducer } from "./store/reducer";

export const COLORS = [
  "#f44336",
  "#e91e63",
  "#9c27b0",
  "#673ab7",
  "#3f51b5",
  "#2196f3",
  "#03a9f4",
  "#00bcd4",
  "#009688",
  "#4caf50",
  "#8bc34a",
  "#cddc39",
  "#ffeb3b",
  "#ffc107",
  "#ff9800",
  "#ff5722",
  "#795548",
  "#607d8b",
];

/*
 * Sagas
 */

/*
 * Reducers
 */

/*
 * Store
 */

const saga = createSagaMiddleware();

const enhancers: StoreEnhancer[] = [];

const middleware: Middleware[] = [logger, saga];

const preloadedState = {};

const options = {
  devTools: true,
  enhancers: enhancers,
  middleware: middleware,
  preloadedState: preloadedState,
  reducer: reducer,
};

export const store: EnhancedStore = configureStore(options);

saga.run(root);
