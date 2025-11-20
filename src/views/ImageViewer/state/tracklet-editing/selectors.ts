import { createSelector } from "@reduxjs/toolkit";
import { TrackletEditingState } from "./types";
import { RootState } from "store/rootReducer";

export const selectSelectedTrackletIds = (state: TrackletEditingState) =>
  state.selectedTracklets;

export const selectIsTrackSelected = createSelector(
  [selectSelectedTrackletIds, (_state: RootState, trackId: string) => trackId],
  (selectedIds, trackId) => selectedIds.includes(trackId),
);
export const selectEditSession = (state: TrackletEditingState) =>
  state.editSession;

export const selectIsEditingTrack = (state: TrackletEditingState) =>
  state.editSession.mode !== null;

export const selectPendingTracklet = (state: TrackletEditingState) =>
  state.editSession.pendingTracklet;

export const selectEditMode = (state: TrackletEditingState) =>
  state.editSession.mode;
