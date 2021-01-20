import { combineReducers } from "redux";
import {
  applicationSlice,
  classifierSlice,
  imageViewerSlice,
  projectSlice,
} from "../slices";

const reducers = {
  classifier: classifierSlice.reducer,
  imageViewer: imageViewerSlice.reducer,
  project: projectSlice.reducer,
  settings: applicationSlice.reducer,
};

export const reducer = combineReducers(reducers);
