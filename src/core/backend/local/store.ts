import type { Dispatch } from "@reduxjs/toolkit";

import type { RootState } from "store/rootReducer";

/* The slice of the Redux store the local backend reads and writes through. */
export type StoreHandle = { getState(): RootState; dispatch: Dispatch };
