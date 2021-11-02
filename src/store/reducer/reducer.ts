import { combineReducers } from "redux";
import {
  imageViewerSlice,
  classifierSlice,
  projectSlice,
  applicationSlice,
  toolOptionsSlice,
} from "../slices";

const reducers = {
  classifier: classifierSlice.reducer,
  imageViewer: imageViewerSlice.reducer,
  project: projectSlice.reducer,
  settings: applicationSlice.reducer,
  toolOptions: toolOptionsSlice.reducer,
};

export const reducer = combineReducers(reducers);
