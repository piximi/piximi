import { DataArray } from "utils/common/image";
import * as T from "io-ts";
import { SerializedAnnotationRType } from "./runtime";
import { ThingType } from "./ThingType";
import { PartialBy, RequireField } from "./utility/PartialBy";
import { NewSerializedAnnotationRType } from "./runtime/SerializedFileType";

export type AnnotationType = PartialBy<
  ThingType,
  "data" | "src" | "bitDepth" | "partition" | "shape"
> & {
  // x1, y1, x_2, y_2
  boundingBox: [number, number, number, number];
  encodedMask: Array<number>;
  decodedMask?: DataArray;
  plane: number;
  imageId: string;
  // TODO serialize: these should not be undefineable
};

export type NewAnnotationType = RequireField<
  AnnotationType,
  "kind" | "containing"
>;

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

export type SerializedAnnotationType = T.TypeOf<
  typeof SerializedAnnotationRType
>;
export type NewSerializedAnnotationType = T.TypeOf<
  typeof NewSerializedAnnotationRType
>;
