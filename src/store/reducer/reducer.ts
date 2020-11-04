import { combineReducers } from "redux";
import { classifierSlice, projectSlice } from "../slices";

const reducers = {
  classifier: classifierSlice.reducer,
  project: projectSlice.reducer,
};

export const reducer = combineReducers(reducers);
