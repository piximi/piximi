import { combineReducers } from "redux";
import { applicationSettingsSlice } from "store/slices/applicationSettings";
import { classifierSlice } from "store/slices/classifier";
import { imageViewerSlice } from "store/slices/imageViewer";
import { projectSlice } from "store/slices/project";
import { segmenterSlice } from "store/slices/segmenter";
import { annotatorSlice } from "store/slices/annotator";
import { newDataSlice } from "./slices/newData/newDataSlice";

const reducers = {
  classifier: classifierSlice.reducer,
  segmenter: segmenterSlice.reducer,
  imageViewer: imageViewerSlice.reducer,
  project: projectSlice.reducer,
  applicationSettings: applicationSettingsSlice.reducer,
  annotator: annotatorSlice.reducer,
  newData: newDataSlice.reducer,
};

export const rootReducer = combineReducers(reducers);
export type RootState = ReturnType<typeof rootReducer>;
