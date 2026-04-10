import { Tensor4D } from "@tensorflow/tfjs";
import { DataArray as IJSDataArray } from "image-js";
import { BitDepth } from "store/data/types";
import { Partition } from "utils/models/enums";
import { Colors } from "utils/types";

export type { BitDepth };

export type ShapeV11 = {
  planes: number;
  height: number;
  width: number;
  channels: number;
};

export type KindV11 = {
  id: string;
  displayName: string;
  containing: string[];
  categories: string[];
  unknownCategoryId: string;
};

export type CategoryV11 = {
  color: string;
  id: string;
  name: string;
  visible: boolean;
  containing: string[];
  kind: string;
};

export type ImageObjectV11 = {
  id: string;
  name: string;
  src: string;
  partition: Partition;
  kind: string;
  data: Tensor4D;
  shape: ShapeV11;
  bitDepth: BitDepth;
  categoryId: string;
  activePlane: number;
  colors: Colors;
  containing: string[];
};

export type AnnotationObjectV11 = {
  id: string;
  name: string;
  src: string;
  partition: Partition;
  kind: string;
  data: Tensor4D;
  shape: ShapeV11;
  bitDepth: BitDepth;
  categoryId: string;
  activePlane: number;
  boundingBox: [number, number, number, number];
  encodedMask: Array<number>;
  decodedMask?: IJSDataArray;
  plane?: number;
  imageId: string;
};
