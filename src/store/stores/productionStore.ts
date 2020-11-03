import { reducer } from "../reducer";
import {
  configureStore,
  EnhancedStore,
  Middleware,
  StoreEnhancer,
} from "@reduxjs/toolkit";
import logger from "redux-logger";
import createSagaMiddleware from "redux-saga";
import { rootSaga } from "../sagas";

export const saga = createSagaMiddleware();

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

export const productionStore: EnhancedStore = configureStore(options);

saga.run(rootSaga);
