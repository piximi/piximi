import { combineReducers } from "redux";
import {
  imageViewerSlice,
  classifierSlice,
  segmenterSlice,
  projectSlice,
  applicationSlice,
  toolOptionsSlice,
} from "../slices";

const reducers = {
  classifier: classifierSlice.reducer,
  segmenter: segmenterSlice.reducer,
  imageViewer: imageViewerSlice.reducer,
  project: projectSlice.reducer,
  settings: applicationSlice.reducer,
  toolOptions: toolOptionsSlice.reducer,
};

export const reducer = combineReducers(reducers);
