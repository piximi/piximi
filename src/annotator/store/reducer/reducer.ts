import { combineReducers } from "redux";
import { applicationSlice } from "../slices";
import { toolOptionsSlice } from "../slices/toolOptionsSlice";
import undoable, { groupByActionTypes } from "redux-undo";
import { StateType } from "../../types/StateType";
import { HistoryStateType } from "../../types/HistoryStateType";
import * as _ from "lodash";

const filterActions = (
  action: any,
  currentState: StateType,
  previousHistory: HistoryStateType
) => {
  const actions = [
    "image-viewer-application/setImageInstances",
    "image-viewer-application/setAnnotated",
    "image-viewer-application/setAnnotating",
    "image-viewer-application/deleteImageInstance",
    "image-viewer-application/setSelectedAnnotation",
    "image-viewer-application/setSelectedAnnotationId",
  ];
  return _.includes(actions, action.type);
};

const reducers = {
  state: undoable(applicationSlice.reducer, {
    filter: filterActions,
    groupBy: groupByActionTypes("image-viewer-application/deleteImageInstance"),
  }),
  toolOptions: toolOptionsSlice.reducer,
};

export const reducer = combineReducers(reducers);
