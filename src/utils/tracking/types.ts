import { DecodedAnnotationObject } from "store/data/types";

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
  gap?: number;
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
