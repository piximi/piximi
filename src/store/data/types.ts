import { Tensor4D } from "@tensorflow/tfjs";

import { Partition } from "utils/models/enums";
import { BitDepth as IJSBitDepth, DataArray as IJSDataArray } from "image-js";
import { Colors, PartialBy, RequireOnly } from "utils/types";

export type BitDepth = IJSBitDepth;
export type DataArray = IJSDataArray;

export type Thing = {
  id: string;
  name: string;
  kind: string;
  bitDepth: BitDepth;
};

export type ImageTimePoint = {
  colors: Colors;
  containing: string[];
  src: string;
  partition: Partition;
  data: Tensor4D;
  shape: Shape;
  categoryId: string;
  activePlane: number;
};
export type ImageObject = Thing & {
  timePoints: Record<number, ImageTimePoint>;
};

export type AnnotationDetails = {
  src: string;
  boundingBox: [number, number, number, number];
  encodedMask: Array<number>;
  decodedMask?: DataArray;
  plane: number;
  imageId: string;
  globalId?: string;
  timePoint: number;
  categoryId: string;
  shape: Shape;
  data: Tensor4D;
};
export type AnnotationObject = Thing & AnnotationDetails;
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
