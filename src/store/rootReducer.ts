import { combineReducers } from "redux";

import { applicationSettingsSlice } from "store/applicationSettings";
import { classifierSlice } from "store/classifier";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { measurementsSlice } from "views/MeasurementViewer/state";
import { projectSlice } from "views/ProjectViewer/state/projectSlice";
import { imageViewerDataSlice } from "@ImageViewer/state/image-viewer-data/imageViewerDataSlice";

import { dataSlice } from "./data";
import { appTasksSlice } from "./appTasks/appTasksSlice";

const reducers = {
  classifier: classifierSlice.reducer,
  imageViewer: imageViewerSlice.reducer,
  imageViewerData: imageViewerDataSlice.reducer,
  project: projectSlice.reducer,
  applicationSettings: applicationSettingsSlice.reducer,
  annotator: annotatorSlice.reducer,
  data: dataSlice.reducer,
  measurements: measurementsSlice.reducer,
  appTasks: appTasksSlice.reducer,
};

export const rootReducer = combineReducers(reducers);
export type RootState = ReturnType<typeof rootReducer>;
