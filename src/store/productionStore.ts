import {
  configureStore,
  EnhancedStore,
  Middleware,
  StoreEnhancer,
} from "@reduxjs/toolkit";
import logger from "redux-logger";

import { rootReducer, RootState } from "./rootReducer";
import { annotatorMiddleware } from "store/annotator/annotatorListeners";
import { imageViewerMiddleware } from "./imageViewer/imageViewerListeners";
import { projectMiddleware } from "./project/projectListeners";
import { dataMiddleware } from "./data/dataListeners";
import { classifierSlice } from "./classifier";
import { annotatorSlice } from "./annotator";
import { applicationSettingsSlice } from "./applicationSettings";
import { imageViewerSlice } from "./imageViewer";
import { dataSlice } from "./data/dataSlice";
import { projectSlice } from "./project";
import { segmenterSlice } from "./segmenter";
import { classifierMiddleware } from "./classifier/classiferListener";
import { segmenterMiddleware } from "./segmenter/segmenterListeners";
import { measurementsSlice } from "./measurements/measurementsSlice";
import { measurementsMiddleware } from "./measurements/measurementListeners";

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
    ? [logger]
    : [];

let listenerMiddlewares: Middleware[] = [
  annotatorMiddleware.middleware,
  imageViewerMiddleware.middleware,
  projectMiddleware.middleware,
  dataMiddleware.middleware,
  classifierMiddleware.middleware,
  segmenterMiddleware.middleware,
  measurementsMiddleware.middleware,
];

const preloadedState: RootState = {
  classifier: classifierSlice.getInitialState(),
  annotator: annotatorSlice.getInitialState(),
  applicationSettings: applicationSettingsSlice.getInitialState(),
  imageViewer: imageViewerSlice.getInitialState(),
  data: dataSlice.getInitialState(),
  project: projectSlice.getInitialState(),
  segmenter: segmenterSlice.getInitialState(),
  measurements: measurementsSlice.getInitialState(),
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
