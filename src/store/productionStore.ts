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
import { measurementsSlice } from "views/MeasurementView2/state/redux/measurementsSlice";
import { applicationMiddleware } from "./applicationSettings/applicationListeners";
import { imageViewerDataSlice } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataSlice";
import { imageViewerDataMiddleware } from "views/ImageViewer/state/image-viewer-data/ImageViewerDataListeners";
import { trackEditingSlice } from "views/ImageViewer/state/tracklet-editing/trackletEditingSlice";

const loggingMiddleware: Middleware[] =
  import.meta.env.NODE_ENV !== "production" &&
  import.meta.env.VITE_APP_LOG_LEVEL === "2"
    ? [logger as Middleware<object, any, Dispatch<UnknownAction>>]
    : [];

const listenerMiddlewares: Middleware[] = [
  annotatorMiddleware.middleware,
  projectMiddleware.middleware,
  dataMiddleware.middleware,
  applicationMiddleware.middleware,
  imageViewerDataMiddleware.middleware,
];

const preloadedState: RootState = {
  classifier: classifierSlice.getInitialState(),
  annotator: annotatorSlice.getInitialState(),
  applicationSettings: applicationSettingsSlice.getInitialState(),
  imageViewer: imageViewerSlice.getInitialState(),
  imageViewerData: imageViewerDataSlice.getInitialState(),
  data: dataSlice.getInitialState(),
  project: projectSlice.getInitialState(),
  segmenter: segmenterSlice.getInitialState(),
  measurements: measurementsSlice.getInitialState(),
  trackEditing: trackEditingSlice.getInitialState(),
};

const options = {
  devTools: {
    trace: true,
    traceLimit: 15, // A traceLimit of 11 seems to be the minumum to get the full trace, set to 15 for a buffer
    actionsDenylist: [
      "applicationSettings/sendLoadPercent",
      "applicationSettings/setLoadPercent",
    ],
    actionSanitizer: (action: any) => {
      // Strip large channelData arrays from DevTools to prevent breaking
      if (
        action.type === "data/batchUpdateAnnotationChannelMeasurements" ||
        action.type === "data/batchUpdateImageChannelMeasurements"
      ) {
        return {
          ...action,
          payload: action.payload.map((item: any) => ({
            id: item.id,
            channelMeasurements: item.channelMeasurements.map(
              (channel: any) => ({
                channelId: channel.channelId,
                // Strip channelData array, keep only statistics
                channelData: channel.channelData
                  ? `[${channel.channelData.length} items]`
                  : undefined,
                total: channel.total,
                min: channel.min,
                max: channel.max,
                mean: channel.mean,
                std: channel.std,
                mad: channel.mad,
                lowerQuartile: channel.lowerQuartile,
                upperQuartile: channel.upperQuartile,
                histogram: channel.histogram
                  ? `[${channel.histogram.length} items]`
                  : undefined,
              }),
            ),
          })),
        };
      }
      return action;
    },
  },
  middleware: () => new Tuple(...listenerMiddlewares, ...loggingMiddleware),
  preloadedState: preloadedState,
  reducer: rootReducer,
};

export const productionStore = configureStore(options);

export const initStore = (loadedData: RootState | undefined) => {
  options.preloadedState = loadedData ?? preloadedState;

  const store = configureStore(options) as EnhancedStore;

  return store;
};

export type AppState = ReturnType<typeof productionStore.getState>;
export type AppDispatch = typeof productionStore.dispatch;
