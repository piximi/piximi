import { PendingTracklet, Tracklet } from "store/data/types";

export type TrackletEditingState = {
  selectedTracklets: string[];
  editSession: {
    mode: "create" | "edit" | null;
    metadataId?: string;
    trackletId?: string;
    pendingTracklet?: PendingTracklet;
    snapshot?: Tracklet; // For rollback when editing existing track
  };
};
