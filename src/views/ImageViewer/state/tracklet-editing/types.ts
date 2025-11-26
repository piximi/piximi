import { PendingTracklet, Tracklet } from "store/data/types";

type TrackletCreationMode = {
  mode: "create";
  metadataId: string;
  trackletId: string;
  pendingTracklet: PendingTracklet;
  frames: Record<number, string>;
};
type TrackletEditMode = Omit<TrackletCreationMode, "mode"> & {
  mode: "edit";
  snapshot: Tracklet;
};
export type TrackletEditSession =
  | { mode: null }
  | TrackletCreationMode
  | TrackletEditMode;

export type TrackletManagementMode =
  | null
  | "create"
  | "remove"
  | "join"
  | "sever";

export type TrackletManagementSession = {
  active: boolean;
  mode: TrackletManagementMode;
  primaryTracklet?: Tracklet;
};
export type TrackletEditingState = {
  selectedTracklets: string[];
  editSession: TrackletEditSession;
  managementSession: TrackletManagementSession;
};
