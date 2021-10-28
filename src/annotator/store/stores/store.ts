import {
  configureStore,
  EnhancedStore,
  Middleware,
  StoreEnhancer,
} from "@reduxjs/toolkit";
import logger from "redux-logger";
import { reducer } from "../reducer";
import * as Sentry from "@sentry/react";
import thunk from "redux-thunk";

const sentryReduxEnhancer = Sentry.createReduxEnhancer({});

const enhancers: StoreEnhancer[] = [sentryReduxEnhancer];

const middleware: Middleware[] = [logger, thunk];

const preloadedState = {};

const options = {
  devTools: true,
  enhancers: enhancers,
  middleware: middleware,
  preloadedState: preloadedState,
  reducer: reducer,
};

export const store: EnhancedStore = configureStore(options);
