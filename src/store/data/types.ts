import { Tensor4D } from "@tensorflow/tfjs";
import { DataArray } from "utils/file-io/types";
import { BitDepth } from "image-js";
import { Partition } from "utils/models/enums";
import { Colors, PartialBy, RequireField } from "utils/common/types";

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

export type Category = RequireField<OldCategory, "containing" | "kind">;

export type Kind = {
  id: string;
  containing: string[];
  categories: string[];
  unknownCategoryId: string;
};
export type KindWithCategories = Omit<Kind, "categories"> & {
  categories: Category[];
};

export type Shape = {
  planes: number;
  height: number;
  width: number;
  channels: number;
};

export type ShapeArray = [number, number, number, number];

/*
OLD TYPES
*/
export type OldImageType = {
  activePlane: number;
  categoryId: string;
  colors: Colors;
  bitDepth: BitDepth;
  id: string;
  name: string;
  shape: Shape;
  data: Tensor4D; // [Z, H, W, C]
  partition: Partition;
  src: string;
  kind?: string;
  containing?: string[]; // The URI to be displayed on the canvas
};

export type OldCategory = {
  color: string; // 3 byte hex, eg. "#a08cd2"
  id: string;
  name: string;
  visible: boolean;
  containing?: string[];
  kind?: string;
};

export type OldAnnotationType = {
  id: string;
  src?: string;
  data?: Tensor4D;
  categoryId: string;
  boundingBox: [number, number, number, number]; // x1, y1, x_2, y_2
  encodedMask: Array<number>;
  decodedMask?: DataArray;
  plane: number;
  imageId: string;
  // TODO serialize: these should not be undefineable
};

export type OldDecodedAnnotationType = Omit<
  OldAnnotationType & {
    decodedMask: DataArray;
  },
  "encodedMask"
>;
