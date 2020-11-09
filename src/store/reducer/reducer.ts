import { combineReducers } from "redux";
import { classifierSlice, projectSlice } from "../slices";
import { settingsSlice } from "../slices/settingsSlice";

const reducers = {
  classifier: classifierSlice.reducer,
  project: projectSlice.reducer,
  settings: settingsSlice.reducer,
};

export const reducer = combineReducers(reducers);
