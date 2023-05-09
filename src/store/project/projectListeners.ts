import { createListenerMiddleware } from "@reduxjs/toolkit";
import { TypedAppStartListening } from "types";
import { projectSlice } from "./projectSlice";

export const imageViewerMiddleware = createListenerMiddleware();
const startAppListening =
  imageViewerMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: projectSlice.actions.resetProject,
  effect: () => {},
});
