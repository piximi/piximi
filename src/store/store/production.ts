import {
  configureStore,
  EnhancedStore,
  Middleware,
  StoreEnhancer,
} from "@reduxjs/toolkit";
import localforage from "localforage";
import logger from "redux-logger";
import { Persistor, persistReducer, persistStore } from "redux-persist";
import autoMergeLevel2 from "redux-persist/es/stateReconciler/autoMergeLevel2";
import createSagaMiddleware from "redux-saga";
import thunk from "redux-thunk";

import { reducer } from "../reducer";
import { root } from "../sagas";

const saga = createSagaMiddleware();

const enhancers: StoreEnhancer[] = [];

const middleware: Middleware[] = [logger, saga, thunk];

const preloadedState = {};

const storage = localforage.createInstance({
  driver: localforage.INDEXEDDB,
  name: "piximi",
});

const persistConfig = {
  key: "root",
  storage: storage,
  stateReconciler: autoMergeLevel2,
};

const persistedReducer = persistReducer(persistConfig, reducer);

const options = {
  devTools: true,
  enhancers: enhancers,
  middleware: middleware,
  preloadedState: preloadedState,
  reducer: persistedReducer,
};

export const store: EnhancedStore = configureStore(options);

saga.run(root);

export const persistor: Persistor = persistStore(store);
