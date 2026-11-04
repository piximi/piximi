import type { BBox } from "core/entities";

import type { Point } from "utils/types";

export type ComputedTracklet = {
  id: string;
  seriesId: string;
  name?: string;
  color: string;
  start: number;
  end: number;
  parents?: Array<string>;
  children?: Array<string>;
  linkedIds: Array<string>;
};

export type PendingTracklet = Omit<ComputedTracklet, "start" | "end"> &
  Partial<Pick<ComputedTracklet, "start" | "end">>;

/**
 * The tracker view of an AnnotationVolume. `id` is the volume id.
 */
export type TrackInput = {
  id: string;
  kindId: string;
  timepoint: number;
  boundingBox: BBox;
  center: Point;
};

export type CenterOfMass = Point & {
  annotationId: string;
};

export type NearestNeighborResult = {
  sourceId: string;
  // Every target within range, nearest first
  targetId: string[];
  distance: number;
};

export type OverlapResult = {
  id: string;
  // Fraction (0-1) of the target box covered by this box
  overlap: number;
};

export type TrackingResult = {
  tracks: ComputedTracklet[];
  coms: Record<string, CenterOfMass>;
  warnings: string[];
};

export interface TrackerConfig {
  seriesId: string;
  numFrames: number;
  includeIsolatedAnnotations?: boolean;
  gapClosingDist?: number;
  calculateTrackletRelationships?: boolean;
  getColor?: () => string;
}

export interface BBoxTrackingConfig extends TrackerConfig {
  overlapThreshold: number; // 0-1, minimum fraction of the box overlapped
}

export interface CenterOfMassTrackingConfig extends TrackerConfig {
  maxDistance: number; // Maximum pixel distance to consider
}
