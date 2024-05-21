import { createListenerMiddleware } from "@reduxjs/toolkit";
//import { TypedAppStartListening } from "store/types";

export const measurementsMiddleware = createListenerMiddleware();

// const startAppListening =
//   measurementsMiddleware.startListening as TypedAppStartListening;
