import { createSlice } from "@reduxjs/toolkit";

import { projectReset } from "store/actions";

import type { PayloadAction, UnknownAction } from "@reduxjs/toolkit";

/* Who decides when a query's answer may have changed. */
export type RevisionSource = "store" | "backend";

export type BackendSyncState = {
  /* Moves whenever what a query would answer may have changed. */
  dataRevision: number;
  source: RevisionSource;
};

const initialState: BackendSyncState = { dataRevision: 0, source: "store" };

/*
 * What the grids key their backend queries on. With the local backend the
 * data slice is what queries read, so every change to it counts. A remote
 * backend answers from its own store: there the revision moves only when
 * it announces a change, and filling the mirror does not count.
 */
export const backendSyncSlice = createSlice({
  name: "backendSync",
  initialState,
  reducers: {
    setRevisionSource(state, action: PayloadAction<RevisionSource>) {
      state.source = action.payload;
    },
    backendDataChanged(state) {
      state.dataRevision++;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(projectReset, (state) => {
      state.dataRevision++;
    });
    builder.addMatcher(
      (action: UnknownAction) => action.type.startsWith("data/"),
      (state) => {
        if (state.source === "store") state.dataRevision++;
      },
    );
  },
});

export const selectDataRevision = (state: {
  backendSync: BackendSyncState;
}): number => state.backendSync.dataRevision;
