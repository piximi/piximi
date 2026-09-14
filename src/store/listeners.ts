import { createListenerMiddleware } from "@reduxjs/toolkit";

import { getClassifierApi } from "core/dl/classification";

import { projectReset } from "./actions";

import type { TypedAppStartListening } from "store/types";

export const projectMiddleware = createListenerMiddleware();
const startAppListening =
  projectMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: projectReset,
  effect: async () => {
    const cfApi = getClassifierApi();
    await cfApi.removeAllModels();
  },
});
