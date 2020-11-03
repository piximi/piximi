import { combineReducers } from "redux";

import * as classifier from "./classifier";
import * as project from "./project";

const reducers = {
  classifier: classifier.reducer,
  project: project.reducer,
};

export const reducer = combineReducers(reducers);
