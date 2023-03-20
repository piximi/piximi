import { combineReducers } from "redux";
import { applicationSlice } from "store/application";
import { classifierSlice } from "store/classifier";
import { AnnotatorSlice } from "store/annotator";
import { projectSlice } from "store/project";
import { segmenterSlice } from "store/segmenter";
import { toolOptionsSlice } from "store/tool-options";
import { dataSlice } from "store/data/dataSlice";

const reducers = {
  classifier: classifierSlice.reducer,
  segmenter: segmenterSlice.reducer,
  annotator: AnnotatorSlice.reducer,
  project: projectSlice.reducer,
  settings: applicationSlice.reducer,
  toolOptions: toolOptionsSlice.reducer,
  data: dataSlice.reducer,
};

export const reducer = combineReducers(reducers);
export type RootState = ReturnType<typeof reducer>;
