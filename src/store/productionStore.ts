import createSagaMiddleware from "redux-saga";
import {
  configureStore,
  EnhancedStore,
  Middleware,
  StoreEnhancer,
} from "@reduxjs/toolkit";
import logger from "redux-logger";
import createSagaMonitor from "@clarketm/saga-monitor";

import { rootReducer } from "./rootReducer";
import { rootSaga } from "./rootSaga";
import { dataMiddleware } from "store/slices/data/dataListeners";
import { annotatorMiddleware } from "store/slices/annotator/annotatorListeners";
import { imageViewerMiddleware } from "./slices/imageViewer/imageViewerListeners";
import { projectMiddleware } from "./slices/project/projectListeners";

const sagaMonitorConfig = {
  level: "debug", // logging level
  verbose: true, // verbose mode
  color: "#03A9F4", // default color
  rootSagaStart: true, // show root saga start effect
  effectTrigger: true, // show triggered effects
  effectResolve: true, // show resolved effects
  effectReject: true, // show rejected effects
  effectCancel: true, // show cancelled effects
  actionDispatch: true, // show dispatched actions
};

export const saga = createSagaMiddleware(
  process.env.NODE_ENV !== "production"
    ? {
        onError: (err, errInfo) => console.error(err, errInfo),
        sagaMonitor:
          process.env.REACT_APP_LOG_LEVEL === "5"
            ? createSagaMonitor(sagaMonitorConfig)
            : undefined,
      }
    : undefined
);

const enhancers: StoreEnhancer[] = [];

/* In order to ensure that sagas are ran after the dispatched action,
 * always keep "saga" as the last item in the middleware array .
 * https://redux-saga.js.org/docs/api/index.html#selectselector-args
 *
 * For infor on changing the execution order, see https://github.com/redux-saga/redux-saga/issues/148
 */
let loggingMiddleware: Middleware[] =
  process.env.NODE_ENV !== "production" &&
  process.env.REACT_APP_LOG_LEVEL === "2"
    ? [logger, saga]
    : [saga];

let listenerMiddlewares: Middleware[] = [
  dataMiddleware.middleware,
  annotatorMiddleware.middleware,
  imageViewerMiddleware.middleware,
  projectMiddleware.middleware,
];

const preloadedState = {};

const options = {
  devTools: true,
  enhancers: enhancers,
  middleware: [...listenerMiddlewares, ...loggingMiddleware],
  preloadedState: preloadedState,
  reducer: rootReducer,
};

export const productionStore: EnhancedStore = configureStore(options);
export type AppDispatch = typeof productionStore.dispatch;

saga.run(rootSaga);
