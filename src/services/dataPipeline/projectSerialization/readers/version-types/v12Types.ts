import { RawTensorData } from "services/dataPipeline/projectSerialization/types";
import { BitDepth, Shape } from "store/data/types";
import { ClassifierState, ProjectState, SegmenterState } from "store/types";
import { Partition } from "utils/models/enums";
import { ColorsRaw } from "utils/types";

// ============================================================
// V12 Piximi State
// ============================================================

export type V12PiximiState = {
  project: ProjectState;
  classifier: ClassifierState;
  segmenter: SegmenterState;
  data: {
    kinds: V12Kind[];
    categories: V12Category[];
    metadata: V12ImageMetadata[];
    images: V12RawImageObject[];
    annotations: V12RawAnnotationObject[];
    relationships: V12Relationships;
  };
};

// ============================================================
// V11 Data
// ============================================================

export type V12Category = {
  id: string;
  color: string;
  name: string;
  kind: string;
  visible: boolean;
};

export type V12Kind = {
  id: string;
  displayName: string;
  unknownCategoryId: string;
};

export type V12ImageMetadata = {
  id: string;
  name: string;
  kind: string;
  bitDepth: BitDepth;
  shape: Shape;
  timeSeries: boolean;
  imageDataIds: string[];
  defaultImageId: string;
};

export type V12RawImageObject = {
  id: string;
  name: string;
  metadataId: string;
  colors: ColorsRaw;
  categoryId: string;
  activePlane: number;
  partition: Partition;
  timepoint?: number;
  tensorData: RawTensorData;
};

export type V12RawAnnotationObject = {
  id: string;
  name: string;
  kind: string;
  bitDepth: BitDepth;
  partition: Partition;
  boundingBox: [number, number, number, number];
  encodedMask: number[];
  plane: number;
  imageId: string;
  timepoint: number;
  categoryId: string;
  shape: Shape;
  activePlane?: number;
  childIds?: string[];
  globalId?: string; // time-series: global identifier across timepoints
  trackId?: string; // time-series: tracklet membership
  tensorData: RawTensorData;
};

export type V12Relationships = {
  kindToCategories: Record<string, string[]>;
  kindToAnnotations: Record<string, string[]>;
  categoryToImages: Record<string, string[]>;
  categoryToAnnotations: Record<string, string[]>;
  imageToAnnotations: Record<string, string[]>;
  metadataToTracklets: Record<string, string[]>;
};
