import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TrackletEditingState } from "./types";
import { Tracklet } from "store/data/types";
import { generateUUID } from "store/data/utils";
import { getRestrictedRandomHexColor } from "utils/colorUtils";

const initialState: TrackletEditingState = {
  selectedTracklets: [],
  editSession: {
    mode: null,
  },
};

export const imageViewerDataSlice = createSlice({
  name: "imageViewerData",
  initialState,
  reducers: {
    resetState() {
      return initialState;
    },
    selectTrack: (state, action: PayloadAction<string>) => {
      if (!state.selectedTracklets.includes(action.payload)) {
        state.selectedTracklets.push(action.payload);
      }
    },

    deselectTrack: (state, action: PayloadAction<string>) => {
      const index = state.selectedTracklets.indexOf(action.payload);
      if (index !== -1) {
        state.selectedTracklets.splice(index, 1);
      }
    },

    toggleTrackSelection: (state, action: PayloadAction<string>) => {
      const index = state.selectedTracklets.indexOf(action.payload);
      if (index !== -1) {
        state.selectedTracklets.splice(index, 1);
      } else {
        state.selectedTracklets.push(action.payload);
      }
    },

    setSelectedTracks: (state, action: PayloadAction<string[]>) => {
      state.selectedTracklets = action.payload;
    },

    clearTrackSelection: (state) => {
      state.selectedTracklets = [];
    },
    beginCreateTrack: (
      state,
      action: PayloadAction<{ metadataId: string; categoryId: string }>,
    ) => {
      if (state.editSession.mode !== null) {
        console.error("Cannot start track - edit session already active");
        return;
      }

      const id = generateUUID();
      state.editSession = {
        mode: "create",
        metadataId: action.payload.metadataId,
        trackletId: id,
        pendingTracklet: {
          id,
          metadataId: action.payload.metadataId,
          linkedIds: [],
          color: getRestrictedRandomHexColor({
            similarity: { baseColor: "#FBB904", minDifference: 20 },
          }),
        },
      };
    },

    addAnnotationToPendingTrack: (
      state,
      action: PayloadAction<{
        annId: string;
        timepoint: number;
      }>,
    ) => {
      const pending = state.editSession.pendingTracklet;
      if (!pending) return;

      // Don't add if already in track
      if (pending.linkedIds.includes(action.payload.annId)) return;

      pending.linkedIds.push(action.payload.annId);

      // Update start/end
      if (
        pending.start === undefined ||
        action.payload.timepoint < pending.start
      ) {
        pending.start = action.payload.timepoint;
      }
      if (pending.end === undefined || action.payload.timepoint > pending.end) {
        pending.end = action.payload.timepoint;
      }
    },

    removeAnnotationFromPendingTrack: (
      state,
      action: PayloadAction<string>,
    ) => {
      const pending = state.editSession.pendingTracklet;
      if (!pending) return;

      pending.linkedIds = pending.linkedIds.filter(
        (id) => id !== action.payload,
      );

      // TODO: Recalculate start/end based on remaining annotations
    },

    cancelPendingTrack: (state) => {
      // Listener will handle annotation cleanup
      state.editSession = { mode: null };
    },

    // === EDIT WORKFLOW ===
    beginEditTrack: (state, action: PayloadAction<Tracklet>) => {
      const tracklet = action.payload;
      if (state.editSession.mode !== null) {
        console.error("Cannot edit track - edit session already active");
        return;
      }

      state.editSession = {
        mode: "edit",
        metadataId: tracklet.metadataId,
        trackletId: tracklet.id,
        pendingTracklet: { ...tracklet }, // Working copy
        snapshot: { ...tracklet }, // Original for rollback
      };
    },

    cancelTrackEdit: (state) => {
      // Listener will handle rollback
      state.editSession = { mode: null };
    },
  },
});
