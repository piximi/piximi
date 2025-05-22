import {
  configureStore,
  Dispatch,
  EnhancedStore,
  Middleware,
  Tuple,
  UnknownAction,
} from "@reduxjs/toolkit";
import logger from "redux-logger";

import { annotatorMiddleware } from "views/ImageViewer/state/annotator/annotatorListeners";
import { imageViewerMiddleware } from "views/ImageViewer/state/imageViewer/imageViewerListeners";
import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { rootReducer, RootState } from "./rootReducer";
import { projectMiddleware } from "./project/projectListeners";
import { dataMiddleware } from "./data/dataListeners";
import { classifierSlice } from "./classifier";
import { applicationSettingsSlice } from "./applicationSettings";
import { dataSlice } from "./data/dataSlice";
import { projectSlice } from "./project";
import { segmenterSlice } from "./segmenter";
import { measurementsSlice } from "./measurements/measurementsSlice";
import { measurementsMiddleware } from "./measurements/measurementListeners";
import { applicationMiddleware } from "./applicationSettings/applicationListeners";

const loggingMiddleware: Middleware[] =
  import.meta.env.NODE_ENV !== "production" &&
  import.meta.env.VITE_APP_LOG_LEVEL === "2"
    ? [logger as Middleware<object, any, Dispatch<UnknownAction>>]
    : [];

const listenerMiddlewares: Middleware[] = [
  annotatorMiddleware.middleware,
  imageViewerMiddleware.middleware,
  projectMiddleware.middleware,
  dataMiddleware.middleware,
  measurementsMiddleware.middleware,
  applicationMiddleware.middleware,
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
  devTools: { trace: true, traceLimit: 15 }, // A traceLimit of 11 seems to be the minumum to get the full trace, set to 15 for a buffer
  middleware: () => new Tuple(...listenerMiddlewares, ...loggingMiddleware),
  preloadedState: preloadedState,
  reducer: rootReducer,
};

export const productionStore: EnhancedStore = configureStore(options);

export const initStore = (loadedData: RootState | undefined) => {
  const options = {
    devTools: { trace: true, traceLimit: 15 },
    middleware: () => new Tuple(...listenerMiddlewares, ...loggingMiddleware),
    preloadedState: loadedData ?? {},
    reducer: rootReducer,
  };
  const store = configureStore(options) as EnhancedStore;

  return store;
};
