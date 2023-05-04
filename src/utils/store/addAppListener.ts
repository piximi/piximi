// Not currently used, but might be useful. Leaving as a reminder

import { TypedAddListener, addListener } from "@reduxjs/toolkit";
import { RootState } from "store/reducer/reducer";
import { AppDispatch } from "store/stores/productionStore";

// Redux-Toolkit: https://redux-toolkit.js.org/api/createListenerMiddleware#addlistener
export const addAppListener = addListener as TypedAddListener<
  RootState,
  AppDispatch
>;
