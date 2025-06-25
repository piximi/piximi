import { Tensor4D } from "@tensorflow/tfjs";

import { Partition } from "utils/models/enums";
import { BitDepth as IJSBitDepth, DataArray as IJSDataArray } from "image-js";
import { Colors, PartialBy, RequireOnly } from "utils/types";

export type BitDepth = IJSBitDepth;
export type DataArray = IJSDataArray;

export type Thing = {
  id: string;
  name: string;
  src: string;
  partition: Partition;
  kind: string;
  data: Tensor4D;
  shape: Shape;
  bitDepth: BitDepth;
  categoryId: string;
  activePlane: number;
};

export type ImageObject = Thing & {
  colors: Colors;
  containing: string[];
};

export type AnnotationObject = Thing & {
  boundingBox: [number, number, number, number];
  encodedMask: Array<number>;
  decodedMask?: DataArray;
  plane?: number;
  imageId: string;
};

export type ImageTimepointData = {
  colors: Colors;
  src: string;
  data: Tensor4D;
  categoryId: string;
  activePlane: number;
};
export type TSImageObject = {
  id: string;
  name: string;
  kind: string;
  bitDepth: BitDepth;
  containing: string[];
  partition: Partition;
  shape: Shape;
  timepoints: Record<number, ImageTimepointData>;
};

export type FullTimepointImage = Omit<TSImageObject, "timepoints"> &
  ImageTimepointData & { timepoint: number };

export type TSAnnotationObject = {
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
  globalId?: string;
  timepoint: number;
  categoryId: string;
  shape: Shape;
  data: Tensor4D;
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
  TSAnnotationObject & {
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
  containing: string[];
  kind: string;
};

export type Kind = {
  id: string;
  displayName: string;
  containing: string[];
  categories: string[];
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
  | RequireOnly<Partial<ImageObject>, "id">
  | RequireOnly<Partial<AnnotationObject>, "id">
>;

export type ImageUpdates = Array<
  Partial<Omit<TSImageObject, "id" | "containing" | "timePoints">> & {
    id: string;
    timePoints?: Record<number, Partial<ImageTimepointData>>;
  }
>;

export type AnnotationUpdates = Array<
  RequireOnly<Partial<TSAnnotationObject>, "id">
>;
