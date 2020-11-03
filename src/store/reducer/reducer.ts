import { projectReducer } from "./projectReducer";
import { combineReducers } from "redux";
import { classifierSlice } from "../slices";

const reducers = {
  classifier: classifierSlice.reducer,
  project: projectReducer,
};

export const reducer = combineReducers(reducers);
