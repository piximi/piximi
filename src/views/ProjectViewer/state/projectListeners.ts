import { createListenerMiddleware } from "@reduxjs/toolkit";

import { getClassifierApi } from "core/dl/classification";

import { classifierSlice } from "store/classifier";
import { dataSlice } from "store/data";

import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";

import { projectSlice } from "./projectSlice";

import type { TypedAppStartListening } from "store/types";

export const projectMiddleware = createListenerMiddleware();
const startAppListening =
  projectMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: projectSlice.actions.resetProject,
  effect: (action, listenerAPI) => {
    listenerAPI.dispatch(dataSlice.actions.clearState());
    listenerAPI.dispatch(classifierSlice.actions.resetClassifiers());
    listenerAPI.dispatch(imageViewerSlice.actions.resetImageViewer());
  },
});

startAppListening({
  actionCreator: projectSlice.actions.resetProject,
  effect: async () => {
    const cfApi = getClassifierApi();
    await cfApi.removeAllModels();
  },
});
