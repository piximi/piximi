import { createListenerMiddleware } from "@reduxjs/toolkit";

import { classifierSlice } from "store/classifier";
import type { TypedAppStartListening } from "store/types";
import { imageViewerSlice } from "views/ImageViewer/state/imageViewer";
import { dataSlice } from "store/data";

import { getClassifierApi } from "utils/dl/classification";

import { projectSlice } from "./projectSlice";

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
