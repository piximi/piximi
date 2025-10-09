import { Tensor4D } from "@tensorflow/tfjs";

import { Partition } from "utils/models/enums";
import { BitDepth as IJSBitDepth, DataArray as IJSDataArray } from "image-js";
import { ColorsRaw, PartialBy, RequireOnly } from "utils/types";

export type BitDepth = IJSBitDepth;
export type DataArray = IJSDataArray;

export type TPKey = string;

export type ImageData = {
  id: string;
  name: string;
  metadataId: string;
  colors: ColorsRaw;
  src: string;
  data: Tensor4D;
  categoryId: string;
  activePlane: number;
  partition: Partition;
  timepoint?: number;
};

export type BaseExtractedImageData = {
  id: string;
  bitDepth: number;
  shape: Shape;
  colors: ColorsRaw;
  data: Tensor4D;
  src: string;
};
export type ImageMetadata = {
  id: string;
  name: string;
  kind: string;
  bitDepth: BitDepth;
  shape: Shape;
  timeSeries: boolean;
  imageDataIds: string[];
  defaultImageId: string;
};

export type FullTimepointImage = Omit<ImageMetadata, "timepoints"> &
  ImageData & { timepoint: TPKey };

export type AnnotationObject = {
  globalId?: string;
  trackId?: string;
  id: string;
  name: string;
  kind: string;
  bitDepth: BitDepth;
  partition: Partition;
  src: string;
  boundingBox: [number, number, number, number];
  encodedMask: Array<number>;
  decodedMask?: DataArray;
  plane: number;
  imageId: string;
  childIds?: string[];
  timepoint: number;
  categoryId: string;
  shape: Shape;
  data: Tensor4D;
  activePlane?: number;
};
export type LinkNode = {
  id: string;
  time: number;
  globalId: string;
  parentIds: string[]; // to handle merges
  childIds: string[]; // to handle splits
};
export type LinkGraph = Record<string, LinkNode>;

export type Tracklet = {
  metadataId: string;
  trackId: string;
  color: string;
  start?: number;
  end?: number;
  children?: string[];
  parents?: string[];
  linkedIds: string[];
};
export type DecodedAnnotationObject = Omit<
  AnnotationObject & {
    decodedMask: DataArray;
  },
  "encodedMask"
>;
export type PartialDecodedAnnotationObject = PartialBy<
  DecodedAnnotationObject,
  "src" | "data" | "name" | "kind" | "bitDepth" | "shape"
>;
export type DecodedTSAnnotationObject = Omit<
  AnnotationObject & {
    decodedMask: DataArray;
  },
  "encodedMask"
>;
export type PartialTSDecodedAnnotationObject = PartialBy<
  DecodedTSAnnotationObject,
  "src" | "data" | "name" | "kind" | "bitDepth" | "shape"
>;

export type Category = {
  color: string; // 3 byte hex, eg. "#a08cd2"
  id: string;
  name: string;
  visible: boolean;
  kind: string;
};

export type Kind = {
  id: string;
  displayName: string;
  unknownCategoryId: string;
};

export type Shape = {
  planes: number;
  height: number;
  width: number;
  channels: number;
};

export type ShapeArray = [number, number, number, number];

export type CategoryUpdates = {
  id: string;
  changes: Partial<Omit<Category, "id" | "containing">>;
};

export type ThingsUpdates = Array<
  | RequireOnly<Partial<ImageMetadata>, "id">
  | RequireOnly<Partial<AnnotationObject>, "id">
>;

export type ImageUpdates = Array<
  Partial<Omit<ImageMetadata, "id" | "containing" | "timePoints">> & {
    id: string;
    timePoints?: Record<TPKey, Partial<ImageData>>;
  }
>;

export type AnnotationUpdates = Array<
  RequireOnly<Partial<AnnotationObject>, "id">
>;

export type GeneralizedKindItem = {
  id: string;
  name: string;
  categoryId: string;
  selected?: boolean; // UI state for bulk operations
  kind: string;

  // Spatial/display info (common to both)
  boundingBox?: [number, number, number, number];
  plane?: number;
  activePlane: number;

  // Time series info
  timepoint?: number;

  // Visual representation
  src: string;
  colors?: ColorsRaw;
  data: Tensor4D;

  // Metadata for operations
  metadataId?: string;
  shape: Shape;
  bitDepth: BitDepth;
  partition: Partition;

  // Optional fields that might only apply to one type
  childIds?: string[]; // for annotations with hierarchical relationships
  containing?: string[]; // for images

  // For displaying timeseries
  grouped?: boolean;
};

export type GeneralizedKindItemEditableProps = Pick<
  GeneralizedKindItem,
  "name" | "categoryId" | "partition"
>;
