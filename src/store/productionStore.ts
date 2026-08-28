import { configureStore, Tuple } from "@reduxjs/toolkit";
import { logger } from "redux-logger";

import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { classifierSlice } from "store/classifier";
import { projectSlice } from "views/ProjectViewer/state/projectSlice";
import { projectMiddleware } from "views/ProjectViewer/state/projectListeners";
import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/imageViewerDataSlice";
import { measurementsSlice } from "views/MeasurementViewer/state";

import { appTasksSlice } from "./appTasks/appTasksSlice";
import { dataSlice } from "./data";
import { rootReducer } from "./rootReducer";
import { applicationSettingsSlice } from "./applicationSettings";

import type { RootState } from "./rootReducer";
import type {
  Dispatch,
  EnhancedStore,
  Middleware,
  UnknownAction,
} from "@reduxjs/toolkit";

const loggingMiddleware: Middleware[] =
  import.meta.env.NODE_ENV !== "production" &&
  import.meta.env.VITE_APP_LOG_LEVEL === "2"
    ? [logger as Middleware<object, any, Dispatch<UnknownAction>>]
    : [];

const listenerMiddlewares: Middleware[] = [projectMiddleware.middleware];

const preloadedState: RootState = {
  classifier: classifierSlice.getInitialState(),
  annotator: annotatorSlice.getInitialState(),
  applicationSettings: applicationSettingsSlice.getInitialState(),
  imageViewer: imageViewerSlice.getInitialState(),
  imageViewerData: imageViewerDataSlice.getInitialState(),
  measurements: measurementsSlice.getInitialState(),
  data: dataSlice.getInitialState(),
  appTasks: appTasksSlice.getInitialState(),
  project: projectSlice.getInitialState(),
};

const options = {
  devTools: { trace: true, traceLimit: 15 }, // A traceLimit of 11 seems to be the minumum to get the full trace, set to 15 for a buffer
  middleware: () => new Tuple(...listenerMiddlewares, ...loggingMiddleware),
  preloadedState: preloadedState,
  reducer: rootReducer,
};

export const productionStore: EnhancedStore = configureStore(options);
