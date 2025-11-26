import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TrackletEditingState, TrackletManagementMode } from "./types";
import { Tracklet } from "store/data/types";
import { generateUUID } from "store/data/utils";
import { getRestrictedRandomHexColor } from "utils/colorUtils";
import { mutatingFilter } from "utils/arrayUtils";
import { dataSlice } from "store/data";

const initialState: TrackletEditingState = {
  selectedTracklets: [],
  editSession: {
    mode: null,
  },
  managementSession: { active: false, mode: null },
};

export const trackEditingSlice = createSlice({
  name: "trackEditing",
  initialState,
  reducers: {
    resetState() {
      return initialState;
    },
    selectTracklet: (state, action: PayloadAction<string>) => {
      if (!state.selectedTracklets.includes(action.payload)) {
        state.selectedTracklets.push(action.payload);
      }
    },

    deselectTracklet: (state, action: PayloadAction<string>) => {
      const index = state.selectedTracklets.indexOf(action.payload);
      if (index !== -1) {
        state.selectedTracklets.splice(index, 1);
      }
    },

    toggleSelectedTracklet: (state, action: PayloadAction<string>) => {
      const index = state.selectedTracklets.indexOf(action.payload);
      if (index !== -1) {
        state.selectedTracklets.splice(index, 1);
      } else {
        state.selectedTracklets.push(action.payload);
      }
    },

    setSelectedTracklets: (state, action: PayloadAction<string[]>) => {
      state.selectedTracklets = action.payload;
    },

    clearTrackletSelection: (state) => {
      state.selectedTracklets = [];
    },
    beginCreateTracklet: (state, action: PayloadAction<string>) => {
      if (state.editSession.mode !== null) {
        console.error("Cannot start track - edit session already active");
        return;
      }

      const id = generateUUID();
      state.editSession = {
        mode: "create",
        metadataId: action.payload,
        trackletId: id,
        pendingTracklet: {
          id,
          metadataId: action.payload,
          linkedIds: [],
          color: getRestrictedRandomHexColor({
            similarity: { baseColor: "#FBB904", minDifference: 20 },
          }),
        },
        frames: [],
      };
    },

    addAnnotationToPendingTracklet: (
      state,
      action: PayloadAction<{
        annId: string;
        timepoint: number;
      }>,
    ) => {
      const mode = state.editSession.mode;
      if (mode === null) return;
      const { annId, timepoint } = action.payload;
      const pending = state.editSession.pendingTracklet;
      // Don't add if already in track
      if (pending.linkedIds.includes(annId)) return;

      pending.linkedIds.push(annId);
      state.editSession.frames
        ? (state.editSession.frames[timepoint] = annId)
        : (state.editSession.frames = { [timepoint]: annId });

      // Update start/end
      if (pending.start === undefined || timepoint < pending.start) {
        pending.start = timepoint;
      }
      if (pending.end === undefined || timepoint > pending.end) {
        pending.end = timepoint;
      }
    },

    removeAnnotationFromPendingTracklet: (
      state,
      action: PayloadAction<{
        annId: string;
        timepoint: number;
      }>,
    ) => {
      const mode = state.editSession.mode;
      if (mode === null) return;
      const { annId, timepoint } = action.payload;
      const pending = state.editSession.pendingTracklet;

      pending.linkedIds = pending.linkedIds.filter((id) => id !== annId);
      delete state.editSession.frames[timepoint];
      const frames = Object.keys(state.editSession.frames).map(
        (frame) => +frame,
      );
      const sortedFrames = [...frames].sort((a, b) => a - b);
      if (pending.start === timepoint) {
        pending.start = sortedFrames[0];
      }
      if (pending.end === timepoint) {
        pending.end = sortedFrames.at(-1);
      }
    },

    exitEditSession: (state) => {
      state.editSession = { mode: null };
    },

    // === EDIT WORKFLOW ===
    beginEditTracklet: (
      state,
      action: PayloadAction<{
        tracklet: Tracklet;
        frames: Record<number, string>;
      }>,
    ) => {
      const { tracklet, frames } = action.payload;
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
        frames,
      };
    },
    beginTrackManagement: (state) => {
      state.managementSession.active = true;
    },
    endTrackManagement: (state) => {
      state.managementSession = { active: false, mode: null };
    },

    setTrackletManagementMode: (
      state,
      action: PayloadAction<TrackletManagementMode>,
    ) => {
      state.managementSession.mode = action.payload;
      if (action.payload === null)
        state.managementSession.primaryTracklet = undefined;
    },
    setPrimaryManagementTracklet: (
      state,
      action: PayloadAction<Tracklet | undefined>,
    ) => {
      if (action.payload === undefined) {
        state.managementSession.primaryTracklet = undefined;
        return;
      }
      if (!state.managementSession.primaryTracklet)
        state.managementSession.primaryTracklet = action.payload;
      else if (state.managementSession.primaryTracklet.id === action.payload.id)
        state.managementSession.primaryTracklet = undefined;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(dataSlice.actions.deleteTracklet, (state, action) => {
      const deletedTracklet = action.payload;
      mutatingFilter(
        state.selectedTracklets,
        (tracklet) => tracklet !== deletedTracklet,
      );
    });
    builder.addCase(dataSlice.actions.batchDeleteTracklet, (state, action) => {
      const deletedTracklets = action.payload;
      mutatingFilter(
        state.selectedTracklets,
        (tracklet) => !deletedTracklets.includes(tracklet),
      );
    });
  },
});
