import { combineReducers } from "redux";

import { applicationSettingsSlice } from "store/applicationSettings";
import { classifierSlice } from "store/classifier";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { projectSlice } from "store/project";
import { segmenterSlice } from "store/segmenter";
import { annotatorSlice } from "views/ImageViewer/state/annotator";
import { dataSlice } from "./data/dataSlice";
import { measurementsSlice } from "./measurements/measurementsSlice";
import { dataSliceV2 } from "./dataV2/dataSliceV2";
import { appTasksSlice } from "./appTasks/appTasksSlice";
import { projectSlice as projectSliceV2 } from "views/ProjectViewerV2/state/projectSlice";

const reducers = {
  classifier: classifierSlice.reducer,
  segmenter: segmenterSlice.reducer,
  imageViewer: imageViewerSlice.reducer,
  project: projectSlice.reducer,
  projectV2: projectSliceV2.reducer,
  applicationSettings: applicationSettingsSlice.reducer,
  annotator: annotatorSlice.reducer,
  data: dataSlice.reducer,
  dataV2: dataSliceV2.reducer,
  measurements: measurementsSlice.reducer,
  appTasks: appTasksSlice.reducer,
};

export const rootReducer = combineReducers(reducers);
export type RootState = ReturnType<typeof rootReducer>;
