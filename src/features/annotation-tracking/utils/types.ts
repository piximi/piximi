import { DecodedAnnotationObject } from "store/data/types";
import { Tracklet } from "store/data/types";
import { Point, RequireField } from "utils/types";
import { ProtoAnnotationObject } from "views/ImageViewer/state/types";

export type TrackerType = "center-of-mass" | "bbox";
export type AnnotationInfo = Pick<
  DecodedAnnotationObject,
  "id" | "boundingBox" | "trackId" | "decodedMask" | "timepoint"
> & {
  centerOfMass?: {
    x: number;
    y: number;
  };
};
export type OverlapResult = AnnotationInfo & {
  overlapArea: number;
};

export type CenterOfMass = {
  annotationId: string;
  x: number;
  y: number;
};
export type NearestNeighborResult = {
  sourceId: string;
  targetId: string[];
  distance: number;
};

/**
 * Result from tracking computation
 */
export type TrackingResult = {
  trackId: string;
  annotationIds: string[];
  color: string;
};

export interface TrackerConfig {
  imageMetadataId: string;
  numFrames: number; // max number of timpoints
  includeIsolatedAnnotations?: boolean;
  gapClosingDist?: number;
  calculateTrackletRelationships?: boolean;
}
/**
 * Configuration for bbox tracking
 */
export interface BBoxTrackingConfig extends TrackerConfig {
  overlapThreshold: number; // 0-1, minimum overlap
}

/**
 * Configuration for center-of-mass tracking
 */
export interface CenterOfMassTrackingConfig extends TrackerConfig {
  maxDistance: number; // Maximum pixel distance to consider
}

export interface TrackVisualizerProps {
  tracks: Tracklet[];
  numFrames: number;
  width?: number;
  height?: number;
  trackHeight?: number;
  trackSpacing?: number;
  selectedTracks: string[];
  toggleSelectedTrack: (trackId: string) => void;
  onTrackClick?: (id: string) => void;
}

export type ValidTracklet = RequireField<Tracklet, "start" | "end">;

export interface PositionedTrack extends ValidTracklet {
  y: number;
  level: number;
}

export type AnnotationsProps = {
  imageShape: { width: number; height: number };
  images: Record<string, { image: HTMLImageElement; pos: Point }>;
  selectedTracks: string[];
};

export type AnnotationWithTrackId = RequireField<
  ProtoAnnotationObject,
  "trackId"
> & { imageOffset: Point };

export type AnnotationWithImOff = ProtoAnnotationObject & {
  imageOffset: Point;
};

export type AnnotationProps = {
  annotation: ProtoAnnotationObject;
  imageShape: { width: number; height: number };
  imagePosition: Point;
  fillColor: string;
  selected?: boolean;
  isFiltered?: boolean;
  onSelect: () => void;
};

export type TooltipProps = {
  visible: boolean;
  x: number;
  y: number;
  text: string;
};
