import { createListenerMiddleware } from "@reduxjs/toolkit";

import { classifierSlice } from "./classifierSlice";
import { applicationSettingsSlice } from "store/applicationSettings";

import { TypedAppStartListening } from "store/types";

export const classifierMiddleware = createListenerMiddleware();

const startAppListening =
  classifierMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: applicationSettingsSlice.actions.resetApplicationState,
  effect: (action, listenerAPI) => {
    listenerAPI.dispatch(classifierSlice.actions.resetClassifiers());
  },
});
