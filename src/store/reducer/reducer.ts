import { combineReducers } from "redux";
import { classifierSlice, projectSlice } from "../slices";
import { applicationSlice } from "../slices/applicationSlice";

const reducers = {
  classifier: classifierSlice.reducer,
  project: projectSlice.reducer,
  settings: applicationSlice.reducer,
};

export const reducer = combineReducers(reducers);
