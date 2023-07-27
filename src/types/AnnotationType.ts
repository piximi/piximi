import { Tensor4D } from "@tensorflow/tfjs";
import { DataArray } from "utils/common/image";
import * as T from "io-ts";
import { SerializedAnnotationRType } from "./runtime";

export type AnnotationType = {
  // x1, y1, x_2, y_2
  boundingBox: [number, number, number, number];
  categoryId: string;
  id: string;
  encodedMask: Array<number>;
  decodedMask?: DataArray;
  plane: number;
  imageId: string;
  // TODO serialize: these should not be undefineable
  data?: Tensor4D;
  src?: string;
};
export type DecodedAnnotationType = Omit<
  AnnotationType & {
    decodedMask: DataArray;
  },
  "encodedMask"
>;

export type SerializedAnnotationType = T.TypeOf<
  typeof SerializedAnnotationRType
>;
