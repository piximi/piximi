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
import * as Sentry from "@sentry/react";
import thunk from "redux-thunk";

export const saga = createSagaMiddleware();

const sentryReduxEnhancer = Sentry.createReduxEnhancer({});

const enhancers: StoreEnhancer[] = [sentryReduxEnhancer];

const middleware: Middleware[] = [logger, saga, thunk];

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
