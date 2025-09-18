import { Tracklet, LinkNode } from "store/data/types";

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
export type ImageViewerDataState = {
  metadataStack: Record<string, ImageViewerMetadataDetails>;
  activeMetdataId?: string;
  previousImageId?: string;
  selectedCategoryId: string;
  highlightedCategory?: string;
  activeAnnotationIds: Array<string>;
  selectedAnnotationIds: Array<string>;
  linkGraph: Record<string, LinkNode>;
  globalAnnotations: Record<string, Tracklet>;
  tLinking:
    | {
        active: false;
        tracks: Record<string, Record<string, string>>; // annIds -- Record<trackId, Record<imageId, annotationId>>
        trackId: undefined;
      }
    | {
        active: true;
        tracks: Record<string, Record<string, string>>; // annIds -- Record<trackId, Record<imageId, annotationId>>
        trackId: string;
      };
  zLinking: { active: boolean; annIds: Record<string, string> };
  hasUnsavedChanges?: boolean;
  imageIsLoading?: boolean;
};
