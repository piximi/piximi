import { createListenerMiddleware } from "@reduxjs/toolkit";
import { TypedAppStartListening } from "store/types";
import { applicationSettingsSlice } from "./applicationSettingsSlice";

export const applicationMiddleware = createListenerMiddleware();
const startAppListening =
  applicationMiddleware.startListening as TypedAppStartListening;

startAppListening({
  actionCreator: applicationSettingsSlice.actions.sendLoadPercent,
  effect: async (action, listenerApi) => {
    // do work
    listenerApi.dispatch(
      applicationSettingsSlice.actions.setLoadPercent({
        loadPercent: action.payload.loadPercent,
        loadMessage: action.payload.loadMessage,
      })
    );

    // prevent others from doing work
    listenerApi.unsubscribe();

    // for the next 100ms
    await listenerApi.delay(100);

    // then continue letting others do work
    listenerApi.subscribe();
  },
});
