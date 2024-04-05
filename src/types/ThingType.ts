import { Tensor4D } from "@tensorflow/tfjs";
import { Partition } from "./Partition";
import { Shape } from "./Shape";
import { BitDepth } from "image-js";
import { Colors } from "./tensorflow";
import { DataArray } from "utils/common/image";
import { PartialBy } from "./utility/PartialBy";
import { SerializedAnnotationRTypeV2 } from "./runtime/SerializedFileType";
import * as T from "io-ts";

export type ThingType = {
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

export type NewImageType = ThingType & {
  colors: Colors;
  containing: string[];
};
export type NewImageAttributeType = keyof NewImageType;

export type NewAnnotationType = ThingType & {
  boundingBox: [number, number, number, number];
  encodedMask: Array<number>;
  decodedMask?: DataArray;
  plane?: number;
  imageId: string;
};
export type NewDecodedAnnotationType = Omit<
  NewAnnotationType & {
    decodedMask: DataArray;
  },
  "encodedMask"
>;
export type PartialDecodedAnnotationType = PartialBy<
  NewDecodedAnnotationType,
  "src" | "data" | "name" | "kind" | "bitDepth" | "shape"
>;
export type NewSerializedAnnotationType = T.TypeOf<
  typeof SerializedAnnotationRTypeV2
>;
