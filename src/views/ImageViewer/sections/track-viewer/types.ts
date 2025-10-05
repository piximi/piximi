import { Tracklet } from "store/data/types";
import { Point, RequireField } from "utils/types";
import { ProtoAnnotationObject } from "views/ImageViewer/state/types";

export interface TrackVisualizerProps {
  tracks: Tracklet[];
  numFrames: number;
  width?: number;
  height?: number;
  trackHeight?: number;
  trackSpacing?: number;
  primaryTrack: string | undefined;
  setPrimaryTrack: (trackId: string) => void;
  secondaryTracks: string[];
  setSecondaryTracks: (tracks: string[]) => void;
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
  onClick: (annotation: ProtoAnnotationObject) => void;
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
