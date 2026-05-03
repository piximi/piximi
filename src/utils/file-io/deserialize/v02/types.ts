import { Tensor4D } from "@tensorflow/tfjs";
import { DataArray as IJSDataArray } from "image-js";
import { BitDepth } from "store/data/types";
import { Partition } from "utils/dl/enums";
import { Colors } from "utils/types";

export type { BitDepth };

export type ShapeV02 = {
  planes: number;
  height: number;
  width: number;
  channels: number;
};

export type ShapeArrayV02 = [number, number, number, number];

export type KindV02 = {
  id: string;
  displayName: string;
  containing: string[];
  categories: string[];
  unknownCategoryId: string;
};

export type CategoryV02 = {
  color: string;
  id: string;
  name: string;
  visible: boolean;
  containing: string[];
  kind: string;
};

export type ImageObjectV02 = {
  id: string;
  name: string;
  src: string;
  partition: Partition;
  kind: string;
  data: Tensor4D;
  shape: ShapeV02;
  bitDepth: BitDepth;
  categoryId: string;
  activePlane: number;
  colors: Colors;
  containing: string[];
};

export type AnnotationObjectV02 = {
  id: string;
  name: string;
  src: string;
  partition: Partition;
  kind: string;
  data: Tensor4D;
  shape: ShapeV02;
  bitDepth: BitDepth;
  categoryId: string;
  activePlane: number;
  boundingBox: [number, number, number, number];
  encodedMask: Array<number>;
  decodedMask?: IJSDataArray;
  plane?: number;
  imageId: string;
};
