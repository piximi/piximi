import createSagaMiddleware from "redux-saga";
import {
  configureStore,
  EnhancedStore,
  Middleware,
  StoreEnhancer,
} from "@reduxjs/toolkit";
import * as Sentry from "@sentry/react";
import thunk from "redux-thunk";
import logger from "redux-logger";

import { reducer } from "../reducer";
import { rootSaga } from "../sagas";

export const saga = createSagaMiddleware();

const sentryReduxEnhancer = Sentry.createReduxEnhancer({});

const enhancers: StoreEnhancer[] = [sentryReduxEnhancer];

let middleware: Middleware[] =
  process.env.NODE_ENV === "production" || process.env.REACT_APP_NO_LOG
    ? [saga, thunk]
    : [logger, saga, thunk];

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
