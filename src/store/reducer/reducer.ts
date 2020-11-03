import { classifierReducer } from "./classifierReducer";
import { projectReducer } from "./projectReducer";
import { combineReducers } from "redux";

const reducers = {
  classifier: classifierReducer,
  project: projectReducer,
};

export const reducer = combineReducers(reducers);
