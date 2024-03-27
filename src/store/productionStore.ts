import createSagaMiddleware from "redux-saga";
import {
  AnyAction,
  configureStore,
  Dispatch,
  EnhancedStore,
  Middleware,
  StoreEnhancer,
} from "@reduxjs/toolkit";
import logger from "redux-logger";
import createSagaMonitor from "@clarketm/saga-monitor";

import { rootReducer, RootState } from "./rootReducer";
import { annotatorMiddleware } from "store/slices/annotator/annotatorListeners";
import { imageViewerMiddleware } from "./slices/imageViewer/imageViewerListeners";
import { projectMiddleware } from "./slices/project/projectListeners";
import { newDataMiddleware } from "./slices/newData/dataListenersNew";
import { classifierSlice } from "./slices/classifier";
import { annotatorSlice } from "./slices/annotator";
import { applicationSettingsSlice } from "./slices/applicationSettings";
import { imageViewerSlice } from "./slices/imageViewer";
import { newDataSlice } from "./slices/newData/newDataSlice";
import { projectSlice } from "./slices/project";
import { segmenterSlice } from "./slices/segmenter";
import { classifierMiddleware } from "./slices/classifier/listeners/classiferListener";
import { segmenterMiddleware } from "./slices/segmenter/listeners/segmenterListeners";

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
  annotatorMiddleware.middleware,
  imageViewerMiddleware.middleware,
  projectMiddleware.middleware,
  newDataMiddleware.middleware,
  classifierMiddleware.middleware,
  segmenterMiddleware.middleware,
];

const preloadedState: RootState = {
  classifier: classifierSlice.getInitialState(),
  annotator: annotatorSlice.getInitialState(),
  applicationSettings: applicationSettingsSlice.getInitialState(),
  imageViewer: imageViewerSlice.getInitialState(),
  newData: newDataSlice.getInitialState(),
  project: projectSlice.getInitialState(),
  segmenter: segmenterSlice.getInitialState(),
};

const options = {
  devTools: true,
  enhancers: enhancers,
  middleware: [...listenerMiddlewares, ...loggingMiddleware],
  preloadedState: preloadedState,
  reducer: rootReducer,
};

export const productionStore: EnhancedStore = configureStore(options);

export const initStore = (loadedData: RootState | undefined) => {
  const options = {
    devTools: true,
    enhancers: enhancers,
    middleware: [...listenerMiddlewares, ...loggingMiddleware],
    preloadedState: loadedData ?? {},
    reducer: rootReducer,
  };
  const store = configureStore(options) as EnhancedStore;

  return store;
};

export type AppDispatch = Dispatch<AnyAction>;
