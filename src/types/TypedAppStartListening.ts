import { TypedStartListening } from "@reduxjs/toolkit";
import { RootState } from "store/rootReducer";
import { AppDispatch } from "store/productionStore";

export type TypedAppStartListening = TypedStartListening<
  RootState,
  AppDispatch
>;
