import { createSelector } from "@reduxjs/toolkit";
import { TrackletEditingState } from "./types";
import { RootState } from "store/rootReducer";

export const selectSelectedTrackletIds = ({
  trackEditing,
}: {
  trackEditing: TrackletEditingState;
}) => trackEditing.selectedTracklets;

export const selectIsTrackSelected = createSelector(
  [selectSelectedTrackletIds, (_state: RootState, trackId: string) => trackId],
  (selectedIds, trackId) => selectedIds.includes(trackId),
);
export const selectEditSession = ({
  trackEditing,
}: {
  trackEditing: TrackletEditingState;
}) => trackEditing.editSession;

export const selectIsEditingTrack = ({
  trackEditing,
}: {
  trackEditing: TrackletEditingState;
}) => trackEditing.editSession.mode !== null;

export const selectPendingTracklet = ({
  trackEditing,
}: {
  trackEditing: TrackletEditingState;
}) =>
  trackEditing.editSession.mode !== null
    ? trackEditing.editSession.pendingTracklet
    : undefined;

export const selectEditMode = ({
  trackEditing,
}: {
  trackEditing: TrackletEditingState;
}) => trackEditing.editSession.mode;
