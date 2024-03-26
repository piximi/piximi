import { DataArray } from "utils/common/image";
import * as T from "io-ts";
import { SerializedAnnotationRType } from "./runtime";
import { ThingType } from "./ThingType";
import { NewSerializedAnnotationRType } from "./runtime/SerializedFileType";
import { Tensor4D } from "@tensorflow/tfjs";
import { PartialBy } from "./utility/PartialBy";

export type AnnotationType = {
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

export type NewAnnotationType = ThingType & {
  boundingBox: [number, number, number, number];
  encodedMask: Array<number>;
  decodedMask?: DataArray;
  plane?: number;
  imageId: string;
};

export type DecodedAnnotationType = Omit<
  AnnotationType & {
    decodedMask: DataArray;
  },
  "encodedMask"
>;

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

export type SerializedAnnotationType = T.TypeOf<
  typeof SerializedAnnotationRType
>;
export type NewSerializedAnnotationType = T.TypeOf<
  typeof NewSerializedAnnotationRType
>;
