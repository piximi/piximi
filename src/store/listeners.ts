import { createListenerMiddleware } from "@reduxjs/toolkit";

import { getClassifierApi } from "core/dl/classification";

import { registerProjectViewerListeners } from "views/ProjectViewer/state/listeners";
import { registerImageViewerListeners } from "views/ImageViewer/state/imageViewerData/listeners";

import { projectReset } from "./actions";
import { registerDataStorageListeners } from "./data/listeners";

import type { TypedAppStartListening } from "store/types";

export const projectMiddleware = createListenerMiddleware();
const startAppListening =
  projectMiddleware.startListening as TypedAppStartListening;

registerDataStorageListeners(startAppListening);
registerProjectViewerListeners(startAppListening);
registerImageViewerListeners(startAppListening);

startAppListening({
  actionCreator: projectReset,
  effect: async () => {
    const cfApi = getClassifierApi();
    await cfApi.removeAllModels();
  },
});
