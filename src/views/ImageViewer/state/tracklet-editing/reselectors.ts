import { createSelector } from "@reduxjs/toolkit";
import { selectTrackletEntities } from "store/data/selectors";
import { selectEditSession } from "./selectors";
import { isPopulatedTracklet } from "store/data/utils";

export const selectPendingTrackletEntities = createSelector(
  selectTrackletEntities,
  selectEditSession,
  (trackletEntities, editSession) => {
    if (editSession.mode === null) return trackletEntities;
    if (!isPopulatedTracklet(editSession.pendingTracklet))
      return trackletEntities;

    const pendingTracklets = { ...trackletEntities };
    pendingTracklets[editSession.trackletId] = editSession.pendingTracklet;
    return pendingTracklets;
  },
);

export const selectAllPendingTracklets = createSelector(
  selectPendingTrackletEntities,
  (pendingTrackletEntities) => {
    return Object.values(pendingTrackletEntities);
  },
);
