import { PendingTracklet } from "store/data/types";

export type ImageViewerMetadataDetails = {
  id: string;
  name: string;
  activePlane: number;
  activeImageId: string;
  activeSrcs: string[];
  images: Record<string, ImageViewerImageProperties>;
  timeSeries?: boolean;
};

export type ImageViewerImageProperties = {
  id: string;
  timepoint?: number;
  categoryId: string;
  ZTPreview: string;
};

export type TrackingUIState = {
  showTracklets: boolean;
  selectedTracklets: string[];
};
export type ImageViewerDataState = {
  metadataStack: Record<string, ImageViewerMetadataDetails>;
  activeMetdataId?: string;
  previousImageId?: string;
  selectedCategoryId: string;
  highlightedCategory?: string;
  activeAnnotationIds: Array<string>;
  selectedAnnotationIds: Array<string>;
  trackingUI: TrackingUIState;
  tLinking:
    | {
        active: false;
        trackId: undefined;
      }
    | {
        active: true;
        trackId: string;
        pendingTracklet: PendingTracklet;
      };
  zLinking: { active: boolean; annIds: Record<string, string> };
  hasUnsavedChanges?: boolean;
  imageIsLoading?: boolean;
};
