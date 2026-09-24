import { createListenerMiddleware } from "@reduxjs/toolkit";

import { getClassifierApi } from "core/dl/classification";

import { registerProjectViewerListeners } from "views/ProjectViewer/state/listeners";

import { projectReset } from "./actions";

import type { TypedAppStartListening } from "store/types";

export const projectMiddleware = createListenerMiddleware();
const startAppListening =
  projectMiddleware.startListening as TypedAppStartListening;

registerProjectViewerListeners(startAppListening);

startAppListening({
  actionCreator: projectReset,
  effect: async () => {
    const cfApi = getClassifierApi();
    await cfApi.removeAllModels();
  },
});
