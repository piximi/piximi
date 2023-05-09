import { TypedStartListening } from "@reduxjs/toolkit";
import { RootState } from "store/reducer/reducer";
import { AppDispatch } from "store/stores/productionStore";

export type TypedAppStartListening = TypedStartListening<
  RootState,
  AppDispatch
>;
