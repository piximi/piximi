import { Tensor4D } from "@tensorflow/tfjs";
import { DataArray as IJSDataArray } from "image-js";
import { BitDepth } from "store/data/types";
import { Partition } from "utils/models/enums";

import { Colors } from "utils/types";

/*
V01 TYPES
*/
export type ImageTypeV01 = {
  activePlane: number;
  categoryId: string;
  colors: Colors;
  bitDepth: BitDepth;
  id: string;
  name: string;
  shape: {
    planes: number;
    height: number;
    width: number;
    channels: number;
  };
  data: Tensor4D; // [Z, H, W, C]
  partition: Partition;
  src: string;
  kind?: string;
  containing?: string[]; // The URI to be displayed on the canvas
};

export type CategoryV01 = {
  color: string;
  id: string;
  name: string;
  visible: boolean;
  containing?: string[];
  kind?: string;
};

export type AnnotationTypeV01 = {
  id: string;
  src?: string;
  data?: Tensor4D;
  categoryId: string;
  boundingBox: [number, number, number, number]; // x1, y1, x2, y2
  encodedMask: Array<number>;
  decodedMask?: IJSDataArray;
  plane: number;
  imageId: string;
  // TODO serialize: these should not be undefineable
};
