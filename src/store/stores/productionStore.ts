import createSagaMiddleware from "redux-saga";
import {
  configureStore,
  EnhancedStore,
  Middleware,
  StoreEnhancer,
} from "@reduxjs/toolkit";
import logger from "redux-logger";

import { reducer } from "../reducer";
import { rootSaga } from "../sagas";

export const saga = createSagaMiddleware();

const enhancers: StoreEnhancer[] = [];

/* In order to ensure that sagas are ran after the dispatched action,
 * always keep "saga" as the last item in the middleware array .
 * https://redux-saga.js.org/docs/api/index.html#selectselector-args
 *
 * For infor on changing the execution order, see https://github.com/redux-saga/redux-saga/issues/148
 */
let middleware: Middleware[] =
  process.env.NODE_ENV !== "production" &&
  process.env.REACT_APP_LOG_LEVEL === "2"
    ? [logger, saga]
    : [saga];

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
